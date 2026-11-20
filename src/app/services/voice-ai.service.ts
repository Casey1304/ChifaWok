import { Injectable, signal } from '@angular/core';
import { ProductosService } from './productos.service';
import { MetricasService } from './metricas.service';
import { Producto } from '../models/producto.model';
import { SesionVoz } from '../models/sesion-voz.model';
import { normalizarTexto } from '../utils/texto.util';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'clarification' | 'ready_to_confirm' | 'error';

export interface InterpretedItem {
  producto: Producto;
  cantidad: number;
  notas?: string;
  subtotal: number;
}

export interface InterpretedOrder {
  items: InterpretedItem[];
  modificadoresJerga: string[];
  subtotal: number;
  impuestos: number;
  total: number;
  tipoEntrega: 'delivery' | 'recojo' | 'salon';
  direccion?: string;
  mesa?: string;
  notasGenerales: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceAiService {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  // Reactive state signals
  readonly isBrowserSupported = signal<boolean>(true);
  readonly isListening = signal<boolean>(false);
  readonly isSpeaking = signal<boolean>(false);
  readonly voiceState = signal<VoiceState>('idle');
  readonly transcript = signal<string>('');
  readonly meiResponse = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly isModalOpen = signal<boolean>(false);
  readonly interpretedOrder = signal<InterpretedOrder | null>(null);

  constructor(
    private productosService: ProductosService,
    private metricasService: MetricasService
  ) {
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
  }

  private initSpeechRecognition(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-PE';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening.set(true);
          this.voiceState.set('listening');
          this.errorMessage.set(null);
        };

        this.recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          this.transcript.set(currentTranscript);
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          this.isListening.set(false);
          this.voiceState.set('error');

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            this.errorMessage.set('Permiso de micrófono denegado. Puedes escribir tu pedido manualmente.');
          } else if (event.error === 'no-speech') {
            this.errorMessage.set('No se detectó voz. Por favor intenta hablar de nuevo o escribe tu pedido.');
          } else if (event.error === 'audio-capture') {
            this.errorMessage.set('No se encontró micrófono en el dispositivo. Puedes usar el teclado.');
          } else {
            this.errorMessage.set(`Aviso de voz: ${event.error}. Puedes ingresar tu pedido con texto.`);
          }
        };

        this.recognition.onend = () => {
          this.isListening.set(false);
          const currentText = this.transcript().trim();
          if (currentText.length > 0 && this.voiceState() === 'listening') {
            this.processInput(currentText);
          } else if (this.voiceState() === 'listening') {
            this.voiceState.set('idle');
          }
        };
      } else {
        this.isBrowserSupported.set(false);
      }
    }
  }

  private initSpeechSynthesis(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      const loadVoices = () => {
        const voices = this.synth?.getVoices() || [];
        this.selectedVoice = voices.find(v => v.lang.includes('es-PE')) ||
                             voices.find(v => v.lang.includes('es-419')) ||
                             voices.find(v => v.lang.includes('es-ES')) ||
                             voices.find(v => v.lang.startsWith('es')) ||
                             null;
      };
      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  openModal(): void {
    this.isModalOpen.set(true);
    this.resetState();
    // Default welcome from Mei
    const bienvenida = '¡Hola! Soy Mei, tu asistente de Chifa Wok. ¿Qué delicia al wok te preparo hoy?';
    this.meiResponse.set(bienvenida);
    this.speak(bienvenida);
  }

  closeModal(): void {
    this.stopListening();
    this.stopSpeaking();
    this.isModalOpen.set(false);
    this.resetState();
  }

  startListening(): void {
    if (!this.recognition) {
      this.errorMessage.set('El reconocimiento de voz no está disponible en este navegador. Escribe tu pedido abajo.');
      this.voiceState.set('error');
      return;
    }
    this.stopSpeaking();
    this.transcript.set('');
    this.errorMessage.set(null);
    try {
      this.recognition.start();
    } catch {
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 200);
      } catch (err: any) {
        this.errorMessage.set('No se pudo activar el micrófono. Usa la opción de texto.');
        this.voiceState.set('error');
      }
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening()) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening.set(false);
    }
  }

  speak(text: string): void {
    if (!this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.lang = 'es-PE';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking.set(true);
    };
    utterance.onend = () => {
      this.isSpeaking.set(false);
    };
    utterance.onerror = () => {
      this.isSpeaking.set(false);
    };

    this.synth.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking.set(false);
    }
  }

  processManualText(text: string): void {
    if (!text || text.trim().length === 0) return;
    this.transcript.set(text);
    this.processInput(text);
  }

  // NLP logic for Peruvian-Chinese fusion terminology
  private processInput(rawText: string): void {
    this.voiceState.set('processing');
    const lower = rawText.toLowerCase();

    // 1. Check for Peruvian Chifa culinary slang & modifiers
    const jergaDetectada: string[] = [];
    let notasGenerales = '';

    if (lower.includes('bien taipa') || lower.includes('bien taipá') || lower.includes('taipa') || lower.includes('taipá')) {
      jergaDetectada.push('Bien taipá (Porción generosa)');
      notasGenerales += 'Bien taipá (porción extra generosa). ';
    }
    if (lower.includes('al toque') || lower.includes('rapido') || lower.includes('rápido') || lower.includes('urgente')) {
      jergaDetectada.push('Al toque (Prioridad Alta)');
      notasGenerales += 'Al toque (urgente cocina). ';
    }
    if (lower.includes('sin cebollita') || lower.includes('sin cebolla china') || lower.includes('sin cebolla')) {
      jergaDetectada.push('Sin cebollita china');
      notasGenerales += 'Sin cebollita china. ';
    }
    if (lower.includes('harto aji') || lower.includes('harto ají') || lower.includes('bastante aji') || lower.includes('aji aparte')) {
      jergaDetectada.push('Harto ají chifero');
      notasGenerales += 'Harto ají en pote aparte. ';
    }
    if (lower.includes('poco sillao') || lower.includes('baja sal') || lower.includes('sin mucho sillao')) {
      jergaDetectada.push('Poco sillao (Baja sal)');
      notasGenerales += 'Poco sillao en el salteado. ';
    }
    if (lower.includes('helada') || lower.includes('bien helada')) {
      jergaDetectada.push('Bebida bien helada');
      notasGenerales += 'Bebidas al polo / bien heladas. ';
    }

    // 2. Identify products in the catalog
    const allProducts = this.productosService.productos();
    const matchedItems: InterpretedItem[] = [];

    // Texto normalizado (sin tildes, minúsculas) para comparar con la carta.
    const normalizado = normalizarTexto(rawText);

    // Helper to extract quantity: analiza solo el fragmento del ítem actual,
    // es decir, el texto previo al término encontrado y posterior al último separador.
    const extractQuantity = (text: string, idx: number): number => {
      let prefix = text.substring(Math.max(0, idx - 25), idx);
      const corte = Math.max(prefix.lastIndexOf(','), prefix.lastIndexOf(' y '), prefix.lastIndexOf(' mas '));
      if (corte >= 0) prefix = prefix.substring(corte + 1);
      const p = ` ${prefix} `;
      if (p.includes(' media docena ')) return 0.5;
      if (p.includes(' docena ')) return 1;
      if (/\s(2|dos|par)\s/.test(p)) return 2;
      if (/\s(3|tres)\s/.test(p)) return 3;
      if (/\s(4|cuatro)\s/.test(p)) return 4;
      return 1;
    };

    // Match each product
    for (const prod of allProducts) {
      const searchTerms = [prod.nombre, ...(prod.sinonimos_voz || [])].map(t => normalizarTexto(t));
      const idx = searchTerms
        .map(term => normalizado.indexOf(term))
        .filter(i => i >= 0)
        .reduce((min, i) => Math.min(min, i), Number.POSITIVE_INFINITY);

      if (idx !== Number.POSITIVE_INFINITY) {
        const qty = extractQuantity(normalizado, idx);
        matchedItems.push({
          producto: prod,
          cantidad: qty,
          subtotal: Math.round(qty * prod.precio * 100) / 100
        });
      }
    }

    // 3. Fallback checks for common broad phrases if no direct match
    if (matchedItems.length === 0) {
      if (lower.includes('chaufa') || lower.includes('arroz')) {
        const chaufa = allProducts.find(p => p.id_producto === 1);
        if (chaufa) matchedItems.push({ producto: chaufa, cantidad: 1, subtotal: chaufa.precio });
      } else if (lower.includes('tallarin') || lower.includes('saltado') || lower.includes('lomo')) {
        const tallarin = allProducts.find(p => p.id_producto === 3);
        if (tallarin) matchedItems.push({ producto: tallarin, cantidad: 1, subtotal: tallarin.precio });
      } else if (lower.includes('tipakay') || lower.includes('agridulce')) {
        const tipakay = allProducts.find(p => p.id_producto === 2);
        if (tipakay) matchedItems.push({ producto: tipakay, cantidad: 1, subtotal: tipakay.precio });
      } else if (lower.includes('aeropuerto')) {
        const aero = allProducts.find(p => p.id_producto === 4);
        if (aero) matchedItems.push({ producto: aero, cantidad: 1, subtotal: aero.precio });
      } else if (lower.includes('wantan') || lower.includes('wantanes')) {
        const wantan = allProducts.find(p => p.id_producto === 8);
        if (wantan) matchedItems.push({ producto: wantan, cantidad: 1, subtotal: wantan.precio });
      } else if (lower.includes('gaseosa') || lower.includes('inka') || lower.includes('bebida')) {
        const inka = allProducts.find(p => p.id_producto === 10);
        if (inka) matchedItems.push({ producto: inka, cantidad: 1, subtotal: inka.precio });
      }
    }

    // Check for irrelevant or unsupported queries (e.g. pizza, burger, sushi, ceviche)
    const comidaAjena = ['hamburguesa', 'pizza', 'ceviche', 'sushi', 'taco', 'salchipapa', 'pollo a la brasa'];
    const pideAjeno = comidaAjena.find(c => lower.includes(c));

    if (pideAjeno) {
      this.voiceState.set('clarification');
      const resp = `En Chifa Wok nos especializamos exclusivamente en auténtica gastronomía fusión peruano-china al wok. No preparamos ${pideAjeno}, pero te recomiendo probar nuestro Arroz Chaufa Especial o Tallarín Saltado de Lomo. ¿Te gustaría ordenar uno de ellos?`;
      this.meiResponse.set(resp);
      this.speak(resp);
      this.recordVoiceSession(rawText, resp, [], false, 95.0, jergaDetectada);
      return;
    }

    // 4. Handle Empty or Incomprehensible input
    if (matchedItems.length === 0) {
      this.voiceState.set('clarification');
      const resp = 'No logré identificar los platillos exactos en tu pedido. Puedes decirme, por ejemplo: "Quiero un Arroz Chaufa Especial y una Inka Kola de litro". ¿Qué plato te provoca ordenar?';
      this.meiResponse.set(resp);
      this.speak(resp);
      this.recordVoiceSession(rawText, resp, [], false, 82.0, jergaDetectada);
      return;
    }

    // 5. Successful interpretation!
    const subtotal = matchedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const impuestos = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + impuestos) * 100) / 100;

    const orderProposal: InterpretedOrder = {
      items: matchedItems,
      modificadoresJerga: jergaDetectada,
      subtotal,
      impuestos,
      total,
      tipoEntrega: lower.includes('mesa') ? 'salon' : (lower.includes('llevar') ? 'recojo' : 'delivery'),
      notasGenerales: notasGenerales.trim()
    };

    this.interpretedOrder.set(orderProposal);
    this.voiceState.set('ready_to_confirm');

    // Build Mei's spoken confirmation
    const itemsText = matchedItems.map(i => `${i.cantidad} ${i.producto.nombre}`).join(' y ');
    let confirmMsg = `Entendido, he añadido a tu pedido: ${itemsText}. `;
    if (jergaDetectada.length > 0) {
      confirmMsg += `Tomando en cuenta: ${jergaDetectada.join(', ')}. `;
    }
    confirmMsg += `El total es de ${total.toFixed(2)} soles. ¿Deseas confirmar este pedido?`;

    this.meiResponse.set(confirmMsg);
    this.speak(confirmMsg);

    this.recordVoiceSession(
      rawText,
      confirmMsg,
      matchedItems.map(i => i.producto.nombre),
      true,
      99.2,
      jergaDetectada
    );
  }

  private recordVoiceSession(
    userInput: string,
    meiResp: string,
    platos: string[],
    exitosa: boolean,
    confianza: number,
    jerga: string[]
  ): void {
    const sesion: SesionVoz = {
      id_sesion: Date.now(),
      codigo_llamada: `#CW-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente_nombre: 'Comensal en línea',
      ubicacion: 'Lima Metropolitana • Web',
      canal: 'Voice AI Mei',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      hace_tiempo: 'Ahora mismo',
      duracion_segundos: Math.floor(20 + Math.random() * 25),
      exitosa,
      confianza,
      transcripcion_usuario: userInput,
      respuesta_mei: meiResp,
      platos_identificados: platos,
      modificadores_jerga: jerga,
      estado: 'finalizada'
    };
    this.metricasService.registrarSesion(sesion);
  }

  resetState(): void {
    this.transcript.set('');
    this.meiResponse.set('');
    this.errorMessage.set(null);
    this.voiceState.set('idle');
    this.interpretedOrder.set(null);
  }
}
