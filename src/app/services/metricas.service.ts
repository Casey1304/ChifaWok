import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { PedidosService } from './pedidos.service';
import { SesionVoz } from '../models/sesion-voz.model';

@Injectable({
  providedIn: 'root'
})
export class MetricasService {
  private readonly SESIONES_KEY = 'sesiones_voz';

  readonly sesiones = signal<SesionVoz[]>([]);

  readonly totalSesiones = computed(() => this.sesiones().length);
  readonly sesionesExitosas = computed(() => this.sesiones().filter(s => s.exitosa).length);

  /** Porcentaje de sesiones de voz interpretadas sin aclaraciones. */
  readonly tasaExitoVoiceAI = computed(() => {
    const total = this.totalSesiones();
    if (total === 0) return 0;
    return Math.round((this.sesionesExitosas() / total) * 1000) / 10;
  });

  /** Confianza media informada por el reconocimiento de voz (o 100 para texto). */
  readonly precisionPromedio = computed(() => {
    const lista = this.sesiones();
    if (lista.length === 0) return 0;
    return Math.round((lista.reduce((s, x) => s + (x.confianza || 0), 0) / lista.length) * 10) / 10;
  });

  /** Duración media (s) de las sesiones capturadas por micrófono. */
  readonly duracionPromedio = computed(() => {
    const conDuracion = this.sesiones().filter(s => s.duracion_segundos > 0);
    if (conDuracion.length === 0) return 0;
    return Math.round(conDuracion.reduce((s, x) => s + x.duracion_segundos, 0) / conDuracion.length);
  });

  readonly sesionesConPedido = computed(() => this.sesiones().filter(s => !!s.pedido_asociado_codigo).length);

  /** Porcentaje de sesiones de voz que terminaron en un pedido registrado. */
  readonly tasaConversion = computed(() => {
    const total = this.totalSesiones();
    if (total === 0) return 0;
    return Math.round((this.sesionesConPedido() / total) * 1000) / 10;
  });

  /** Pedidos no cancelados agrupados por canal de origen. */
  readonly pedidosPorCanal = computed(() => {
    const vigentes = this.pedidosService.pedidos().filter(p => p.estado !== 'cancelado');
    const canal = (origen: 'voice_ai' | 'web', nombre: string) => {
      const lista = vigentes.filter(p => (p.origen || 'web') === origen);
      return {
        canal: nombre,
        pedidos: lista.length,
        ingresos: Math.round(lista.reduce((s, p) => s + p.total, 0) * 100) / 100,
        porcentaje: vigentes.length ? Math.round((lista.length / vigentes.length) * 1000) / 10 : 0
      };
    };
    return [canal('voice_ai', 'Voz (Mei)'), canal('web', 'Web (carrito)')];
  });

  readonly pedidosPorVoz = computed(() => this.pedidosPorCanal()[0].pedidos);

  /** Platos más pedidos por voz (unidades), a partir de los pedidos con origen voice_ai. */
  readonly platosMasPedidosVoz = computed(() => {
    const unidades = new Map<string, number>();
    this.pedidosService.pedidos()
      .filter(p => p.origen === 'voice_ai' && p.estado !== 'cancelado')
      .forEach(p => p.detalles.forEach(d => unidades.set(d.nombre_producto, (unidades.get(d.nombre_producto) || 0) + d.cantidad)));
    const total = [...unidades.values()].reduce((s, n) => s + n, 0);
    return [...unidades.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad, porcentaje: total ? Math.round((cantidad / total) * 1000) / 10 : 0 }));
  });

  /** Jerga chifera detectada en las sesiones de voz, con su frecuencia. */
  readonly jergaFrecuente = computed(() => {
    const conteo = new Map<string, number>();
    this.sesiones().forEach(s => (s.modificadores_jerga || []).forEach(j => conteo.set(j, (conteo.get(j) || 0) + 1)));
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]).map(([termino, frecuencia]) => ({ termino, frecuencia }));
  });

  constructor(
    private storage: StorageService,
    private pedidosService: PedidosService
  ) {
    this.loadSesiones();
  }

  loadSesiones(): void {
    const list = this.storage.get<SesionVoz[]>(this.SESIONES_KEY, []);
    this.sesiones.set(list);
  }

  registrarSesion(sesion: SesionVoz): void {
    const updated = [sesion, ...this.sesiones()];
    this.sesiones.set(updated);
    this.storage.set(this.SESIONES_KEY, updated);
  }

  /** Marca la sesión de voz con el código del pedido que originó. */
  vincularPedido(idSesion: number, codigoPedido: string): void {
    const updated = this.sesiones().map(s =>
      s.id_sesion === idSesion
        ? { ...s, pedido_asociado_codigo: codigoPedido, exitosa: true, estado: 'finalizada' as const }
        : s
    );
    this.sesiones.set(updated);
    this.storage.set(this.SESIONES_KEY, updated);
  }
}
