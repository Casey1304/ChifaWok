import { Injectable, signal, computed } from '@angular/core';
import { Producto } from '../models/producto.model';
import { DetallePedido } from '../models/pedido.model';
import { StorageService } from './storage.service';

export interface CartItem {
  producto: Producto;
  cantidad: number;
  notas_especiales?: string;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'cart_items';
  
  readonly items = signal<CartItem[]>([]);

  readonly totalCount = computed(() => 
    this.items().reduce((sum, item) => sum + item.cantidad, 0)
  );

  readonly subtotal = computed(() => 
    this.items().reduce((sum, item) => sum + item.subtotal, 0)
  );

  readonly impuestos = computed(() => 
    Math.round(this.subtotal() * 0.18 * 100) / 100
  );

  readonly total = computed(() => 
    Math.round((this.subtotal() + this.impuestos()) * 100) / 100
  );

  constructor(private storage: StorageService) {
    const saved = this.storage.get<CartItem[]>(this.CART_KEY, []);
    this.items.set(saved);
  }

  addItem(producto: Producto, cantidad = 1, notas?: string): void {
    const current = [...this.items()];
    const existingIndex = current.findIndex(i => i.producto.id_producto === producto.id_producto);

    if (existingIndex > -1) {
      current[existingIndex].cantidad += cantidad;
      current[existingIndex].subtotal = current[existingIndex].cantidad * current[existingIndex].producto.precio;
      if (notas) {
        current[existingIndex].notas_especiales = notas;
      }
    } else {
      current.push({
        producto,
        cantidad,
        notas_especiales: notas,
        subtotal: cantidad * producto.precio
      });
    }

    this.save(current);
  }

  updateQuantity(idProducto: number, delta: number): void {
    let current = [...this.items()];
    const idx = current.findIndex(i => i.producto.id_producto === idProducto);
    if (idx > -1) {
      const newQty = current[idx].cantidad + delta;
      if (newQty <= 0) {
        current = current.filter(i => i.producto.id_producto !== idProducto);
      } else {
        current[idx].cantidad = newQty;
        current[idx].subtotal = newQty * current[idx].producto.precio;
      }
      this.save(current);
    }
  }

  removeItem(idProducto: number): void {
    const current = this.items().filter(i => i.producto.id_producto !== idProducto);
    this.save(current);
  }

  clear(): void {
    this.save([]);
  }

  toDetallesPedido(): DetallePedido[] {
    return this.items().map((item, idx) => ({
      id_detalle: idx + 1,
      id_producto: item.producto.id_producto,
      nombre_producto: item.producto.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio,
      subtotal: item.subtotal,
      notas_especiales: item.notas_especiales
    }));
  }

  private save(items: CartItem[]): void {
    this.items.set(items);
    this.storage.set(this.CART_KEY, items);
  }
}
