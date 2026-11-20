export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'entregado' | 'cancelado';
export type TipoEntrega = 'delivery' | 'recojo' | 'salon';

export interface DetallePedido {
  id_detalle: number;
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas_especiales?: string;
}

export interface Pedido {
  id_pedido: number;
  codigo: string;
  id_cliente: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion?: string;
  id_sesion_voz?: number;
  fecha_pedido: string;
  hora_pedido: string;
  tiempo_estimado_entrega?: string;
  estado: EstadoPedido;
  total: number;
  subtotal: number;
  impuestos: number;
  tipo_entrega: TipoEntrega;
  mesa?: string;
  repartidor?: string;
  notas?: string;
  origen: 'voice_ai' | 'web';
  detalles: DetallePedido[];
  prioridad?: 'alta' | 'normal';
}
