import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { Producto } from '../models/producto.model';
import { Categoria, CATEGORIAS_CHIFA } from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly PRODUCTOS_KEY = 'productos';
  
  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>(CATEGORIAS_CHIFA);

  readonly productosActivos = computed(() => this.productos().filter(p => p.disponible));
  readonly productosDestacados = computed(() => this.productos().filter(p => p.destacado && p.disponible));
  
  readonly totalPlatos = computed(() => this.productos().length);
  readonly totalActivos = computed(() => this.productos().filter(p => p.disponible).length);
  readonly totalPausados = computed(() => this.productos().filter(p => !p.disponible).length);

  constructor(private storage: StorageService) {
    this.loadProductos();
  }

  loadProductos(): void {
    const list = this.storage.get<Producto[]>(this.PRODUCTOS_KEY, []);
    this.productos.set(list);
  }

  getProductoById(id: number): Producto | undefined {
    return this.productos().find(p => p.id_producto === id);
  }

  crearProducto(prod: Omit<Producto, 'id_producto'>): Producto {
    const nuevo: Producto = {
      ...prod,
      id_producto: Date.now(),
      ventas_mes: 0
    };
    const updated = [nuevo, ...this.productos()];
    this.saveProductos(updated);
    return nuevo;
  }

  actualizarProducto(id: number, cambios: Partial<Producto>): boolean {
    const updated = this.productos().map(p => {
      if (p.id_producto === id) {
        return { ...p, ...cambios };
      }
      return p;
    });
    this.saveProductos(updated);
    return true;
  }

  toggleDisponibilidad(id: number): boolean {
    const prod = this.getProductoById(id);
    if (!prod) return false;
    return this.actualizarProducto(id, { disponible: !prod.disponible });
  }

  eliminarProducto(id: number): boolean {
    const updated = this.productos().filter(p => p.id_producto !== id);
    this.saveProductos(updated);
    return true;
  }

  private saveProductos(list: Producto[]): void {
    this.productos.set(list);
    this.storage.set(this.PRODUCTOS_KEY, list);
  }
}
