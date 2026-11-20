import { Injectable, signal } from '@angular/core';
import { ProductosService } from './productos.service';
import { MetricasService } from './metricas.service';
import { Producto } from '../models/producto.model';
import { SesionVoz } from '../models/sesion-voz.model';
import { AuthService } from './auth.service';
import { DudaPedido, interpretarPedido } from '../utils/interprete-pedido.util';
import { calcularTotales } from '../utils/totales.util';

export type VoiceState =
  | 'idle' | 'listening' | 'processing' | 'speaking' | 'clarification'
  | 'identified' | 'ready_to_confirm' | 'registered' | 'error';

/** Duda del intérprete con un identificador para la interfaz. */
export interface DudaVista extends DudaPedido {
  id: number;
}

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
  /** Pedido en construcción: se completa frase a frase y con las sugerencias elegidas. */
  readonly interpretedOrder = signal<InterpretedOrder | null>(null);
  /** Sugerencias pendientes de la última frase (platos dudosos, genéricos o fuera de carta). */
  readonly dudas = signal<DudaVista[]>([]);
  /** Último pedido registrado desde Mei (para el estado "Pedido registrado"). */
  readonly pedidoRegistrado = signal<{ codigo: string; total: number } | null>(null);
  /** true cuando el texto actual proviene del micrófono (no del teclado). */
  readonly entradaPorVoz = signal<boolean>(false);

  /** Confianza (0-1) informada por el motor de reconocimiento para la última frase. */
  private confianzaVoz: number | null = null;
  private inicioEscucha = 0;
  private ultimaSesionId: number | null = null;
  /** Sesiones de voz que forman el pedido en construcción (se enlazan al registrarlo). */
  private sesionesDelPedido: number[] = [];
  private secuenciaDudas = 0;

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
    this.dudas.set([]);
    this.pedidoRegistrado.set(null);
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
    this.pedidoRegistrado.set(null);
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

    const avisos: string[] = [];
    if (resultado.noReconocidos.length > 0) {
      avisos.push(`No encontré en la carta: ${resultado.noReconocidos.map(t => `"${t}"`).join(', ')}.`);
    }
    if (resultado.noDisponibles.length > 0) {
      avisos.push(`Hoy no está disponible: ${resultado.noDisponibles.map(p => p.nombre).join(', ')}.`);
    }

    // Las sugerencias anteriores se descartan: solo se muestran las de esta frase.
    this.dudas.set(resultado.dudas.map(d => ({ ...d, id: ++this.secuenciaDudas })));

    // Lo reconocido con certeza se suma al pedido en construcción.
    const actual = this.interpretedOrder();
    let items = actual ? actual.items.map(i => ({ ...i })) : [];
    for (const nuevo of resultado.items) items = this.sumarItem(items, nuevo.producto, nuevo.cantidad);

    const tipoEntrega: InterpretedOrder['tipoEntrega'] = lower.includes('mesa') ? 'salon'
      : (lower.includes('llevar') || lower.includes('recojo') ? 'recojo' : (actual?.tipoEntrega ?? 'delivery'));
    const jerga = [...new Set([...(actual?.modificadoresJerga ?? []), ...jergaDetectada])];
    const notas = [actual?.notasGenerales, notasGenerales.trim()].filter(Boolean).join(' ').trim();
    this.actualizarPedido(items, { tipoEntrega, modificadoresJerga: jerga, notasGenerales: notas, avisos });

    // Check for irrelevant or unsupported queries (e.g. pizza, burger, sushi, ceviche)
    const comidaAjena = ['hamburguesa', 'pizza', 'ceviche', 'sushi', 'taco', 'salchipapa', 'pollo a la brasa'];
    const pideAjeno = comidaAjena.find(c => lower.includes(c));
    const hayAlgo = resultado.items.length > 0 || resultado.dudas.length > 0;

    let resp: string;
    if (!hayAlgo) {
      resp = pideAjeno
        ? `En Chifa Wok nos especializamos en gastronomía fusión peruano-china al wok. No preparamos ${pideAjeno}, pero te recomiendo nuestro Arroz Chaufa Especial o el Tallarín Saltado de Lomo.`
        : avisos.length > 0
          ? `${avisos.join(' ')} Puedes repetirlo o escribir el nombre del plato.`
          : 'No logré identificar un plato de la carta. Puedes decirlo de nuevo o escribirlo, por ejemplo: "Quiero dos chaufas especiales y una Inka Kola".';
    } else {
      const partes: string[] = [];
      if (resultado.items.length > 0) {
        partes.push(`Agregué ${this.listar(resultado.items)}.`);
      }
      partes.push(...this.preguntasDeDudas());
      partes.push(...avisos);
      if (resultado.dudas.length === 0) {
        partes.push(`Tu pedido suma S/ ${this.interpretedOrder()!.total.toFixed(2)}. ¿Lo confirmo o agregas algo más?`);
      }
      resp = partes.join(' ');
    }

    this.voiceState.set(this.dudas().length > 0 || !this.tieneItems() ? 'clarification' : 'ready_to_confirm');
    this.meiResponse.set(resp);
    this.speak(resp);
    this.recordVoiceSession(
      rawText,
      resp,
      resultado.items.map(i => `${i.cantidad}x ${i.producto.nombre}`),
      resultado.items.length > 0 && resultado.dudas.length === 0 && avisos.length === 0,
      jergaDetectada
    );
  }

  // ---------- Pedido en construcción: sugerencias, cantidades y registro ----------

  /** El comensal elige un plato de las sugerencias: se agrega con la cantidad entendida. */
  elegirSugerencia(idDuda: number, idProducto: number): void {
    const duda = this.dudas().find(d => d.id === idDuda);
    const opcion = duda?.opciones.find(o => o.producto.id_producto === idProducto);
    if (!duda || !opcion) return;

    this.dudas.update(lista => lista.filter(d => d.id !== idDuda));
    const actual = this.interpretedOrder();
    this.actualizarPedido(this.sumarItem(actual?.items ?? [], opcion.producto, duda.cantidad));

    const pendientes = this.dudas().length;
    const resp = `Perfecto, agregué ${duda.cantidad} ${opcion.producto.nombre} a tu pedido. ` +
      (pendientes > 0 ? 'Aún falta elegir otro plato.' : '¿Lo confirmo o agregas algo más?');
    this.voiceState.set(pendientes > 0 ? 'clarification' : 'identified');
    this.meiResponse.set(resp);
    this.speak(resp);
  }

  /** "Ninguno de estos": se descarta la sugerencia sin agregar nada. */
  descartarDuda(idDuda: number): void {
    const duda = this.dudas().find(d => d.id === idDuda);
    if (!duda) return;
    this.dudas.update(lista => lista.filter(d => d.id !== idDuda));
    const resp = `Entendido, no agregué "${duda.texto}". Puedes decir o escribir el nombre del plato.`;
    this.voiceState.set(this.dudas().length > 0 || !this.tieneItems() ? 'clarification' : 'ready_to_confirm');
    this.meiResponse.set(resp);
    this.speak(resp);
  }

  /** Corrige la cantidad de un plato del resumen; si llega a 0 se elimina. */
  cambiarCantidad(idProducto: number, delta: number): void {
    const actual = this.interpretedOrder();
    if (!actual) return;
    const items = actual.items
      .map(i => i.producto.id_producto === idProducto ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0);
    this.actualizarPedido(items);
    if (!this.tieneItems()) this.voiceState.set('clarification');
  }

  quitarItem(idProducto: number): void {
    const actual = this.interpretedOrder();
    if (!actual) return;
    this.actualizarPedido(actual.items.filter(i => i.producto.id_producto !== idProducto));
    if (!this.tieneItems() && this.dudas().length === 0) this.voiceState.set('clarification');
  }

  /** Empieza el pedido de nuevo sin cerrar la conversación. */
  vaciarPedido(): void {
    this.interpretedOrder.set(null);
    this.dudas.set([]);
    this.sesionesDelPedido = [];
    this.voiceState.set('idle');
    this.meiResponse.set('Listo, empecemos de nuevo. ¿Qué te preparo?');
  }

  /** Tras registrar el pedido: muestra la confirmación y deja a Mei lista para otro pedido. */
  marcarRegistrado(codigo: string, total: number): void {
    for (const id of this.sesionesDelPedido) this.metricasService.vincularPedido(id, codigo);
    this.sesionesDelPedido = [];
    this.interpretedOrder.set(null);
    this.dudas.set([]);
    this.transcript.set('');
    this.pedidoRegistrado.set({ codigo, total });
    this.voiceState.set('registered');
    const resp = `¡Listo! Registré tu pedido ${codigo} por S/ ${total.toFixed(2)}. Ya está en la cola del wok.`;
    this.meiResponse.set(resp);
    this.speak(resp);
  }

  private tieneItems(): boolean {
    return (this.interpretedOrder()?.items.length ?? 0) > 0;
  }

  private sumarItem(items: InterpretedItem[], producto: Producto, cantidad: number): InterpretedItem[] {
    const existe = items.find(i => i.producto.id_producto === producto.id_producto);
    if (existe) {
      return items.map(i => i === existe ? { ...i, cantidad: i.cantidad + cantidad } : i);
    }
    return [...items, { producto, cantidad, subtotal: 0 }];
  }

  /** Recalcula subtotales y totales (IGV incluido) del pedido en construcción. */
  private actualizarPedido(items: InterpretedItem[], extra: Partial<InterpretedOrder> = {}): void {
    const actual = this.interpretedOrder();
    const conSubtotal = items.map(i => ({ ...i, subtotal: Math.round(i.cantidad * i.producto.precio * 100) / 100 }));
    const { subtotal, impuestos, total } = calcularTotales(conSubtotal.reduce((s, i) => s + i.subtotal, 0));
    this.interpretedOrder.set({
      tipoEntrega: 'delivery',
      modificadoresJerga: [],
      notasGenerales: '',
      avisos: [],
      ...actual,
      ...extra,
      items: conSubtotal,
      subtotal,
      impuestos,
      total
    });
  }

  private listar(items: ReadonlyArray<{ producto: Producto; cantidad: number }>): string {
    const partes = items.map(i => `${i.cantidad} ${i.producto.nombre}`);
    return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0];
  }

  /** Pregunta de Mei para cada duda pendiente. */
  private preguntasDeDudas(): string[] {
    return this.dudas().map(d => {
      if (d.tipo === 'probable') return `¿Te refieres a ${d.opciones[0].producto.nombre}?`;
      if (d.tipo === 'no_existe') {
        return d.opciones.length > 0
          ? `No tenemos "${d.texto}" en la carta. ¿Quieres alguno de estos?`
          : `No tenemos "${d.texto}" en la carta.`;
      }
      return `Encontré platos parecidos a "${d.texto}". ¿Cuál deseas?`;
    });
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
    this.sesionesDelPedido.push(sesion.id_sesion);
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
    this.dudas.set([]);
    this.pedidoRegistrado.set(null);
    this.sesionesDelPedido = [];
  }
}
