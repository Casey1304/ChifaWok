import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { Pedido, EstadoPedido, DetallePedido, TipoEntrega } from '../models/pedido.model';
import { calcularTotales } from '../utils/totales.util';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private readonly PEDIDOS_KEY = 'pedidos';
  
  readonly pedidos = signal<Pedido[]>([]);

  // Categorized order signals for Admin KDS
  readonly pedidosNuevos = computed(() => 
    this.pedidos().filter(p => p.estado === 'pendiente')
  );
  
  readonly pedidosEnCocina = computed(() => 
    this.pedidos().filter(p => p.estado === 'en_preparacion' && (!p.tiempo_estimado_entrega || !p.tiempo_estimado_entrega.includes('Listo')))
  );

  readonly pedidosListos = computed(() => 
    this.pedidos().filter(p => p.estado === 'en_preparacion' && p.tiempo_estimado_entrega && p.tiempo_estimado_entrega.includes('Listo'))
  );

  readonly pedidosEntregados = computed(() => 
    this.pedidos().filter(p => p.estado === 'entregado')
  );

  readonly pedidosCancelados = computed(() => 
    this.pedidos().filter(p => p.estado === 'cancelado')
  );

  readonly totalVentasDia = computed(() => 
    this.pedidos()
      .filter(p => p.estado !== 'cancelado')
      .reduce((sum, p) => sum + p.total, 0)
  );

  readonly totalPedidosDia = computed(() => 
    this.pedidos().filter(p => p.estado !== 'cancelado').length
  );

  constructor(private storage: StorageService) {
    this.loadPedidos();
  }

  loadPedidos(): void {
    const list = this.storage.get<Pedido[]>(this.PEDIDOS_KEY, []);
    this.pedidos.set(list);
  }

  getPedidoById(id: number): Pedido | undefined {
    return this.pedidos().find(p => p.id_pedido === id);
  }

  getPedidosByCliente(idCliente: number): Pedido[] {
    return this.pedidos().filter(p => p.id_cliente === idCliente);
  }

  crearPedido(datos: {
    idCliente: number;
    clienteNombre: string;
    clienteTelefono: string;
    clienteDireccion?: string;
    tipoEntrega: TipoEntrega;
    mesa?: string;
    notas?: string;
    detalles: DetallePedido[];
    origen?: 'voice_ai' | 'web';
    idSesionVoz?: number;
  }): Pedido {
    // Correlativo a partir del mayor id existente (evita colisiones del id aleatorio anterior).
    const id = Math.max(1044, ...this.pedidos().map(p => p.id_pedido)) + 1;
    // Los precios de la carta incluyen IGV: se desglosa el impuesto contenido.
    const { subtotal, impuestos, total } = calcularTotales(datos.detalles.reduce((sum, d) => sum + d.subtotal, 0));

    const now = new Date();
    const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    const fecha = now.toISOString().split('T')[0];

    const nuevoPedido: Pedido = {
      id_pedido: id,
      codigo: `#${id}`,
      id_cliente: datos.idCliente,
      cliente_nombre: datos.clienteNombre,
      cliente_telefono: datos.clienteTelefono,
      cliente_direccion: datos.clienteDireccion,
      id_sesion_voz: datos.idSesionVoz,
      fecha_pedido: fecha,
      hora_pedido: hora,
      tiempo_estimado_entrega: '20-25 min',
      estado: 'pendiente',
      subtotal,
      impuestos,
      total,
      tipo_entrega: datos.tipoEntrega,
      mesa: datos.mesa,
      notas: datos.notas,
      origen: datos.origen || 'web',
      prioridad: datos.origen === 'voice_ai' ? 'alta' : 'normal',
      detalles: datos.detalles
    };

    const updated = [nuevoPedido, ...this.pedidos()];
    this.savePedidos(updated);
    return nuevoPedido;
  }

  actualizarEstado(id: number, nuevoEstado: EstadoPedido, notasTiempo?: string): boolean {
    const updated = this.pedidos().map(p => {
      if (p.id_pedido === id) {
        return {
          ...p,
          estado: nuevoEstado,
          tiempo_estimado_entrega: notasTiempo || p.tiempo_estimado_entrega
        };
      }
      return p;
    });
    this.savePedidos(updated);
    return true;
  }

  marcarListo(id: number): boolean {
    return this.actualizarEstado(id, 'en_preparacion', 'Listo para despacho');
  }

  marcarEntregado(id: number): boolean {
    return this.actualizarEstado(id, 'entregado', 'Entregado con éxito');
  }

  cancelarPedido(id: number, motivo?: string): boolean {
    const updated = this.pedidos().map(p => {
      if (p.id_pedido === id) {
        return {
          ...p,
          estado: 'cancelado' as EstadoPedido,
          notas: p.notas ? `${p.notas} | Cancelado: ${motivo || 'Solicitud cliente'}` : `Cancelado: ${motivo || 'Solicitud cliente'}`
        };
      }
      return p;
    });
    this.savePedidos(updated);
    return true;
  }

  private savePedidos(list: Pedido[]): void {
    this.pedidos.set(list);
    this.storage.set(this.PEDIDOS_KEY, list);
  }
}
