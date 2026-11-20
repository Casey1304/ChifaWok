import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { Cliente } from '../models/cliente.model';
import { Usuario } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private readonly CLIENTES_KEY = 'clientes';
  
  readonly clientes = signal<Cliente[]>([]);

  readonly totalClientes = computed(() => this.clientes().length);
  readonly clientesVIP = computed(() => this.clientes().filter(c => c.nivel === 'Oro VIP'));
  readonly clientesFrecuentes = computed(() => this.clientes().filter(c => c.nivel === 'Frecuente'));
  readonly clientesNuevos = computed(() => this.clientes().filter(c => c.nivel === 'Nuevo'));

  readonly tasaRecurrencia = computed(() => {
    const total = this.clientes().length;
    if (total === 0) return '0%';
    const recurrentes = this.clientes().filter(c => c.pedidos_totales > 5).length;
    return `${Math.round((recurrentes / total) * 100)}%`;
  });

  readonly ticketPromedio = computed(() => {
    const totalGasto = this.clientes().reduce((sum, c) => sum + c.gasto_total, 0);
    const totalPedidos = this.clientes().reduce((sum, c) => sum + c.pedidos_totales, 0);
    if (totalPedidos === 0) return 0;
    return Math.round((totalGasto / totalPedidos) * 100) / 100;
  });

  constructor(private storage: StorageService) {
    this.loadClientes();
  }

  loadClientes(): void {
    const list = this.storage.get<Cliente[]>(this.CLIENTES_KEY, []);
    this.clientes.set(list);
  }

  getClienteById(id: number): Cliente | undefined {
    return this.clientes().find(c => c.id_cliente === id);
  }

  /**
   * Devuelve el id de cliente (directorio de clientes) asociado a un usuario comensal.
   * Se vincula por correo; si el comensal no figura en el directorio se usa su id de usuario.
   * Retorna null cuando no hay sesión o el usuario no es comensal (p. ej. el administrador).
   */
  idClienteDeUsuario(usuario: Usuario | null): number | null {
    if (!usuario || usuario.rol !== 'CLIENTE') return null;
    const email = usuario.email.trim().toLowerCase();
    const cliente = this.clientes().find(c => (c.email || '').toLowerCase() === email);
    return cliente ? cliente.id_cliente : usuario.id;
  }

  crearCliente(datos: Omit<Cliente, 'id_cliente' | 'puntos_dragon' | 'pedidos_totales' | 'gasto_total' | 'ultimo_pedido'>): Cliente {
    const nuevo: Cliente = {
      ...datos,
      id_cliente: Date.now(),
      pedidos_totales: 0,
      gasto_total: 0,
      puntos_dragon: 50,
      ultimo_pedido: 'Sin pedidos recientes'
    };
    const updated = [nuevo, ...this.clientes()];
    this.saveClientes(updated);
    return nuevo;
  }

  actualizarCliente(id: number, cambios: Partial<Cliente>): boolean {
    const updated = this.clientes().map(c => {
      if (c.id_cliente === id) {
        return { ...c, ...cambios };
      }
      return c;
    });
    this.saveClientes(updated);
    return true;
  }

  private saveClientes(list: Cliente[]): void {
    this.clientes.set(list);
    this.storage.set(this.CLIENTES_KEY, list);
  }
}
