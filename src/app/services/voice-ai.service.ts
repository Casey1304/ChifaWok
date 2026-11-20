import { Injectable, signal } from '@angular/core';
import { ProductosService } from './productos.service';
import { MetricasService } from './metricas.service';
import { Producto } from '../models/producto.model';
import { SesionVoz } from '../models/sesion-voz.model';
import { AuthService } from './auth.service';
import { interpretarPedido } from '../utils/interprete-pedido.util';
import { calcularTotales } from '../utils/totales.util';

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
  /** Avisos para el comensal: platos no reconocidos, no disponibles o ambiguos. */
  avisos: string[];
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
  /** true cuando el texto actual proviene del micrófono (no del teclado). */
  readonly entradaPorVoz = signal<boolean>(false);

  /** Confianza (0-1) informada por el motor de reconocimiento para la última frase. */
  private confianzaVoz: number | null = null;
  private inicioEscucha = 0;
  private ultimaSesionId: number | null = null;

  constructor(
    private productosService: ProductosService,
    private metricasService: MetricasService,
    private auth: AuthService
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
          this.inicioEscucha = Date.now();
        };

        this.recognition.onresult = (event: any) => {
          // Se reconstruye desde el primer resultado para no perder fragmentos ya finalizados.
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal && typeof event.results[i][0].confidence === 'number') {
              this.confianzaVoz = event.results[i][0].confidence;
            }
          }
          this.entradaPorVoz.set(true);
          this.transcript.set(currentTranscript.trim());
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          this.isListening.set(false);
          this.voiceState.set('error');

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            this.errorMessage.set('Permiso de micrófono denegado. Haz clic en el candado de la barra de direcciones, permite el micrófono y vuelve a intentarlo, o escribe tu pedido.');
          } else if (event.error === 'no-speech') {
            this.errorMessage.set('No se detectó voz. Por favor intenta hablar de nuevo o escribe tu pedido.');
          } else if (event.error === 'audio-capture') {
            this.errorMessage.set('No se encontró micrófono en el dispositivo. Puedes usar el teclado.');
          } else if (event.error === 'network') {
            this.errorMessage.set('El reconocimiento de voz del navegador necesita conexión a Internet. Revisa la red o escribe tu pedido.');
          } else if (event.error === 'aborted') {
            this.voiceState.set('idle');
            this.errorMessage.set(null);
          } else if (event.error === 'language-not-supported') {
            this.errorMessage.set('El navegador no admite reconocimiento en español. Usa Google Chrome o Microsoft Edge, o escribe tu pedido.');
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
    // Se pasa a 'idle' antes de detener para que onend no procese texto con el modal cerrado.
    this.voiceState.set('idle');
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // El reconocimiento ya estaba detenido.
      }
    }
    this.isListening.set(false);
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
    this.interpretedOrder.set(null);
    this.confianzaVoz = null;
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
    this.entradaPorVoz.set(false);
    this.confianzaVoz = null;
    this.transcript.set(text.trim());
    this.processInput(text.trim());
  }

  /** Asocia la última sesión de voz con el pedido registrado (visible en el monitor admin). */
  vincularPedido(codigo: string): void {
    if (this.ultimaSesionId !== null) {
      this.metricasService.vincularPedido(this.ultimaSesionId, codigo);
    }
  }

  // NLP logic for Peruvian-Chinese fusion terminology
  private processInput(rawText: string): void {
    this.voiceState.set('processing');
    // Cada frase reemplaza la interpretación anterior: nunca se confirma un resumen desactualizado.
    this.interpretedOrder.set(null);
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

    // 2. Interpretación contra la carta real (sin inventar platos).
    const resultado = interpretarPedido(rawText, this.productosService.productos());
    const matchedItems: InterpretedItem[] = resultado.items.map(i => ({
      producto: i.producto,
      cantidad: i.cantidad,
      subtotal: Math.round(i.cantidad * i.producto.precio * 100) / 100
    }));

    const avisos: string[] = [];
    if (resultado.noReconocidos.length > 0) {
      avisos.push(`No encontré en la carta: ${resultado.noReconocidos.map(t => `"${t}"`).join(', ')}.`);
    }
    if (resultado.noDisponibles.length > 0) {
      avisos.push(`Hoy no está disponible: ${resultado.noDisponibles.map(p => p.nombre).join(', ')}.`);
    }
    for (const a of resultado.ambiguos) {
      const opciones = a.opciones.map(o => o.nombre);
      const lista = opciones.length > 1
        ? `${opciones.slice(0, -1).join(', ')} o ${opciones[opciones.length - 1]}`
        : opciones[0];
      avisos.push(`¿Qué ${a.termino} deseas: ${lista}?`);
    }

    // Check for irrelevant or unsupported queries (e.g. pizza, burger, sushi, ceviche)
    const comidaAjena = ['hamburguesa', 'pizza', 'ceviche', 'sushi', 'taco', 'salchipapa', 'pollo a la brasa'];
    const pideAjeno = comidaAjena.find(c => lower.includes(c));

    if (pideAjeno && matchedItems.length === 0) {
      this.voiceState.set('clarification');
      const resp = `En Chifa Wok nos especializamos exclusivamente en auténtica gastronomía fusión peruano-china al wok. No preparamos ${pideAjeno}, pero te recomiendo probar nuestro Arroz Chaufa Especial o Tallarín Saltado de Lomo. ¿Te gustaría ordenar uno de ellos?`;
      this.meiResponse.set(resp);
      this.speak(resp);
      this.recordVoiceSession(rawText, resp, [], false, jergaDetectada);
      return;
    }

    // 3. Nada reconocido: se pide aclaración (con detalle si hubo términos ambiguos o fuera de carta).
    if (matchedItems.length === 0) {
      this.voiceState.set('clarification');
      const resp = avisos.length > 0
        ? `${avisos.join(' ')} Por favor, repite tu pedido indicando el plato de la carta.`
        : 'No logré identificar los platillos exactos en tu pedido. Puedes decirme, por ejemplo: "Quiero dos chaufas especiales y una Inka Kola". ¿Qué plato te provoca ordenar?';
      this.meiResponse.set(resp);
      this.speak(resp);
      this.recordVoiceSession(rawText, resp, [], false, jergaDetectada);
      return;
    }

    // 4. Pedido interpretado: se muestra para que el comensal lo revise antes de confirmar.
    const { subtotal, impuestos, total } = calcularTotales(matchedItems.reduce((sum, item) => sum + item.subtotal, 0));

    const orderProposal: InterpretedOrder = {
      items: matchedItems,
      modificadoresJerga: jergaDetectada,
      subtotal,
      impuestos,
      total,
      tipoEntrega: lower.includes('mesa') ? 'salon' : (lower.includes('llevar') || lower.includes('recojo') ? 'recojo' : 'delivery'),
      notasGenerales: notasGenerales.trim(),
      avisos
    };

    this.interpretedOrder.set(orderProposal);
    this.voiceState.set(avisos.length > 0 ? 'clarification' : 'ready_to_confirm');

    const itemsText = matchedItems.map(i => `${i.cantidad} ${i.producto.nombre}`).join(' y ');
    let confirmMsg = `Entendí: ${itemsText}. `;
    if (jergaDetectada.length > 0) {
      confirmMsg += `Tomando en cuenta: ${jergaDetectada.join(', ')}. `;
    }
    if (avisos.length > 0) {
      confirmMsg += `${avisos.join(' ')} Puedes repetir el pedido completo o confirmar solo lo entendido. `;
    }
    confirmMsg += `El total es de ${total.toFixed(2)} soles. ¿Deseas confirmar este pedido?`;

    this.meiResponse.set(confirmMsg);
    this.speak(confirmMsg);

    this.recordVoiceSession(
      rawText,
      confirmMsg,
      matchedItems.map(i => `${i.cantidad}x ${i.producto.nombre}`),
      avisos.length === 0,
      jergaDetectada
    );
  }

  private recordVoiceSession(
    userInput: string,
    meiResp: string,
    platos: string[],
    exitosa: boolean,
    jerga: string[]
  ): void {
    const user = this.auth.currentUser();
    const ahora = new Date();
    // Confianza real del motor de voz; para texto escrito se registra 100 (sin error de transcripción).
    const confianza = this.entradaPorVoz() && this.confianzaVoz !== null
      ? Math.round(this.confianzaVoz * 1000) / 10
      : 100;
    const sesion: SesionVoz = {
      id_sesion: ahora.getTime(),
      codigo_llamada: `#CW-${String(ahora.getTime()).slice(-4)}`,
      cliente_nombre: user ? `${user.nombre} ${user.apellido}` : 'Visitante sin sesión',
      ubicacion: this.entradaPorVoz() ? 'Web • Micrófono' : 'Web • Texto',
      canal: 'Voice AI Mei',
      fecha: ahora.toISOString().split('T')[0],
      hora: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      hace_tiempo: 'Ahora mismo',
      duracion_segundos: this.entradaPorVoz() && this.inicioEscucha > 0
        ? Math.max(1, Math.round((ahora.getTime() - this.inicioEscucha) / 1000))
        : 0,
      exitosa,
      confianza,
      transcripcion_usuario: userInput,
      respuesta_mei: meiResp,
      platos_identificados: platos,
      modificadores_jerga: jerga,
      estado: exitosa ? 'finalizada' : 'aclarando'
    };
    this.ultimaSesionId = sesion.id_sesion;
    this.metricasService.registrarSesion(sesion);
  }

  resetState(): void {
    this.entradaPorVoz.set(false);
    this.confianzaVoz = null;
    this.transcript.set('');
    this.meiResponse.set('');
    this.errorMessage.set(null);
    this.voiceState.set('idle');
    this.interpretedOrder.set(null);
  }
}
