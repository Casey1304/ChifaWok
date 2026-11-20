export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  id_categoria: number;
  categoria_nombre: string;
  disponible: boolean;
  imagen: string;
  destacado?: boolean;
  porciones?: string;
  sinonimos_voz?: string[];
  tiempo_preparacion_min?: number;
  ventas_mes?: number;
}
