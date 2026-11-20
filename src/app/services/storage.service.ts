import { Injectable } from '@angular/core';
import { Producto } from '../models/producto.model';
import { Pedido } from '../models/pedido.model';
import { Cliente } from '../models/cliente.model';
import { SesionVoz } from '../models/sesion-voz.model';
import { Usuario } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly PREFIX = 'chifawok_';

  constructor() {
    this.initSeedData();
  }

  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  resetAll(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    this.initSeedData(true);
  }

  private initSeedData(force = false): void {
    if (force || !localStorage.getItem(this.PREFIX + 'seeded')) {
      this.seedProductos();
      this.seedPedidos();
      this.seedClientes();
      this.seedSesionesVoz();
      this.seedUsuarios();
      this.set('seeded', true);
    }
  }

  private seedProductos(): void {
    const productos: Producto[] = [
      {
        id_producto: 1,
        nombre: 'Arroz Chaufa Especial',
        descripcion: 'Una vibrante mezcla de arroz frito al wok con chancho asado al cilindro, lomo tierno, langostinos frescos, huevo y cebollita china, salteado a fuego rugiente.',
        precio: 32.00,
        stock: 45,
        id_categoria: 2,
        categoria_nombre: 'Chaufas',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
        destacado: true,
        porciones: 'Familiar (2 personas)',
        sinonimos_voz: ['chaufa especial', 'arroz chaufa', 'chaufa mixto', 'chaufa con todo'],
        tiempo_preparacion_min: 8,
        ventas_mes: 412
      },
      {
        id_producto: 2,
        nombre: 'Pollo Tipa Kay',
        descripcion: 'Trozos de pechuga de pollo crocantes bañados en nuestra salsa agridulce especial de tamarindo y piña golden, con ajonjolí tostado y durazno.',
        precio: 28.00,
        stock: 32,
        id_categoria: 1,
        categoria_nombre: 'Especialidades',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
        destacado: true,
        porciones: 'Individual generoso',
        sinonimos_voz: ['tipakay', 'pollo agridulce', 'pollo con piña', 'tipa kay'],
        tiempo_preparacion_min: 10,
        ventas_mes: 285
      },
      {
        id_producto: 3,
        nombre: 'Tallarín Saltado de Lomo',
        descripcion: 'Fideos gruesos de huevo salteados al wok con tiernas tiras de lomo fino, cebolla roja crujiente, tomates jugosos y reducción de sillao y salsa de ostión.',
        precio: 35.00,
        stock: 28,
        id_categoria: 3,
        categoria_nombre: 'Saltados',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
        destacado: true,
        porciones: 'Individual generoso',
        sinonimos_voz: ['tallarin saltado', 'tallarines con lomo', 'saltado de fideos'],
        tiempo_preparacion_min: 9,
        ventas_mes: 310
      },
      {
        id_producto: 4,
        nombre: 'Aeropuerto Familiar',
        descripcion: 'La combinación definitiva: arroz chaufa y fideos salteados al wok con frijolito chino, pollo en cubos, chancho y cubierto con crujiente wantán frito.',
        precio: 30.00,
        stock: 40,
        id_categoria: 2,
        categoria_nombre: 'Chaufas',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        destacado: true,
        porciones: 'Familiar',
        sinonimos_voz: ['aeropuerto', 'arroz aeropuerto', 'aeropuerto mixto', 'aeropuerto de pollo'],
        tiempo_preparacion_min: 11,
        ventas_mes: 240
      },
      {
        id_producto: 5,
        nombre: 'Kam Lu Wantán Especial',
        descripcion: 'Wantanes crocantes artesanales rellenos de cerdo y langostino, coronados con piña, durazno, pollo, langostinos y lomo bañados en salsa agridulce de la casa.',
        precio: 38.00,
        stock: 18,
        id_categoria: 1,
        categoria_nombre: 'Especialidades',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
        destacado: false,
        porciones: 'Familiar',
        sinonimos_voz: ['kam lu wantan', 'wantan agridulce', 'kamlu'],
        tiempo_preparacion_min: 12,
        ventas_mes: 195
      },
      {
        id_producto: 6,
        nombre: 'Pollo Chi Jau Kay',
        descripcion: 'Pechuga deshuesada crujiente cubierta con aromática salsa de ostión, canela china, cebollita china y pimiento rojo.',
        precio: 29.00,
        stock: 25,
        id_categoria: 1,
        categoria_nombre: 'Especialidades',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        destacado: false,
        porciones: 'Individual',
        sinonimos_voz: ['chijaukay', 'pollo chi jau kay', 'chi jau kai'],
        tiempo_preparacion_min: 10,
        ventas_mes: 215
      },
      {
        id_producto: 7,
        nombre: 'Sopa Wantán Especial',
        descripcion: 'Caldo reconfortante de gallina y kion con wantanes rellenos de cerdo y langostinos, col china, fideos de arroz, chancho asado y huevo de codorniz.',
        precio: 22.00,
        stock: 20,
        id_categoria: 4,
        categoria_nombre: 'Sopas & Entradas',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
        destacado: false,
        porciones: 'Tazón grande',
        sinonimos_voz: ['sopa wantan', 'sopa wantan especial', 'sopa chifa'],
        tiempo_preparacion_min: 7,
        ventas_mes: 198
      },
      {
        id_producto: 8,
        nombre: 'Wantán Frito Clásico (12 unidades)',
        descripcion: 'Crujientes wantanes dorados al instante acompañados de generosa salsa de tamarindo casera.',
        precio: 16.00,
        stock: 60,
        id_categoria: 4,
        categoria_nombre: 'Sopas & Entradas',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
        destacado: false,
        porciones: '12 unidades',
        sinonimos_voz: ['wantan frito', 'wantanes', 'docena de wantanes'],
        tiempo_preparacion_min: 5,
        ventas_mes: 520
      },
      {
        id_producto: 9,
        nombre: 'Siu Mai Artesanal al Vapor (6 unidades)',
        descripcion: 'Bocaditos al vapor rellenos de carne de cerdo magra, langostinos finamente picados y hongos shiitake con un toque de aceite de ajonjolí.',
        precio: 18.00,
        stock: 30,
        id_categoria: 4,
        categoria_nombre: 'Sopas & Entradas',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80',
        destacado: false,
        porciones: '6 unidades',
        sinonimos_voz: ['siu mai', 'shiu mai', 'dim sum'],
        tiempo_preparacion_min: 8,
        ventas_mes: 140
      },
      {
        id_producto: 10,
        nombre: 'Inka Kola 1L (Helada)',
        descripcion: 'La bebida de sabor nacional bien helada, el maridaje perfecto para un auténtico banquete chifero.',
        precio: 9.00,
        stock: 85,
        id_categoria: 5,
        categoria_nombre: 'Bebidas',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        destacado: false,
        porciones: 'Botella 1 Litro',
        sinonimos_voz: ['inka kola', 'inca kola', 'gaseosa helada', 'inka kola de litro'],
        tiempo_preparacion_min: 1,
        ventas_mes: 530
      },
      {
        id_producto: 11,
        nombre: 'Chicha Morada Clásica de Maíz Morado (1L)',
        descripcion: 'Elaborada artesanalmente con maíz morado culli, piña, manzana, canela, clavo de olor y gotas de limón sutil.',
        precio: 10.00,
        stock: 50,
        id_categoria: 5,
        categoria_nombre: 'Bebidas',
        disponible: true,
        imagen: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        destacado: false,
        porciones: 'Jarra 1 Litro',
        sinonimos_voz: ['chicha', 'chicha morada', 'jarra de chicha'],
        tiempo_preparacion_min: 2,
        ventas_mes: 310
      }
    ];
    this.set('productos', productos);
  }

  private seedPedidos(): void {
    const pedidos: Pedido[] = [
      {
        id_pedido: 1042,
        codigo: '#1042',
        id_cliente: 1,
        cliente_nombre: 'Carlos Mendoza',
        cliente_telefono: '+51 987 654 321',
        id_sesion_voz: 4812,
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:43 PM',
        tiempo_estimado_entrega: '15 min',
        estado: 'pendiente',
        subtotal: 50.00,
        impuestos: 8.00,
        total: 58.00,
        tipo_entrega: 'salon',
        mesa: 'Mesa 4 • Salón Principal',
        notas: 'Sin cebollita china en el chaufa. Bien taipá.',
        origen: 'voice_ai',
        prioridad: 'alta',
        detalles: [
          { id_detalle: 1, id_producto: 1, nombre_producto: 'Arroz Chaufa Especial', cantidad: 1, precio_unitario: 32.00, subtotal: 32.00, notas_especiales: 'Sin cebollita china' },
          { id_detalle: 2, id_producto: 10, nombre_producto: 'Inka Kola 1L (Helada)', cantidad: 2, precio_unitario: 9.00, subtotal: 18.00, notas_especiales: 'Bien heladas' },
          { id_detalle: 3, id_producto: 8, nombre_producto: 'Wantán Frito Clásico (12 unidades)', cantidad: 0.5, precio_unitario: 8.00, subtotal: 8.00, notas_especiales: 'Media porción' }
        ]
      },
      {
        id_pedido: 1043,
        codigo: '#1043',
        id_cliente: 5,
        cliente_nombre: 'Diego Morales',
        cliente_telefono: '+51 933 221 144',
        id_sesion_voz: 4811,
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:45 PM',
        tiempo_estimado_entrega: '20 min',
        estado: 'pendiente',
        subtotal: 62.50,
        impuestos: 10.00,
        total: 72.50,
        tipo_entrega: 'recojo',
        notas: 'Harto ají en pote aparte y salsa de tamarindo extra.',
        origen: 'voice_ai',
        prioridad: 'normal',
        detalles: [
          { id_detalle: 4, id_producto: 5, nombre_producto: 'Kam Lu Wantán Especial', cantidad: 1, precio_unitario: 38.00, subtotal: 38.00 },
          { id_detalle: 5, id_producto: 7, nombre_producto: 'Sopa Wantán Especial', cantidad: 1, precio_unitario: 22.00, subtotal: 22.00 },
          { id_detalle: 6, id_producto: 8, nombre_producto: 'Wantán Frito Clásico (12 unidades)', cantidad: 0.5, precio_unitario: 12.50, subtotal: 12.50, notas_especiales: '6 wantanes con salsa tamarindo' }
        ]
      },
      {
        id_pedido: 1044,
        codigo: '#1044',
        id_cliente: 3,
        cliente_nombre: 'Jorge Alva',
        cliente_telefono: '+51 999 888 777',
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:47 PM',
        tiempo_estimado_entrega: '35 min',
        estado: 'pendiente',
        subtotal: 38.00,
        impuestos: 6.00,
        total: 44.00,
        tipo_entrega: 'delivery',
        cliente_direccion: 'Calle Las Begonias 401, Dpto 502, San Isidro',
        notas: 'Por favor no tocar timbre, llamar al celular.',
        origen: 'web',
        prioridad: 'normal',
        detalles: [
          { id_detalle: 7, id_producto: 3, nombre_producto: 'Tallarín Saltado de Lomo', cantidad: 1, precio_unitario: 34.00, subtotal: 34.00 },
          { id_detalle: 8, id_producto: 11, nombre_producto: 'Chicha Morada Clásica de Maíz Morado (1L)', cantidad: 1, precio_unitario: 10.00, subtotal: 10.00 }
        ]
      },
      {
        id_pedido: 1038,
        codigo: '#1038',
        id_cliente: 4,
        cliente_nombre: 'Ana María Wong',
        cliente_telefono: '+51 945 112 233',
        id_sesion_voz: 4805,
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:35 PM',
        tiempo_estimado_entrega: 'Preparando (5 min rest.)',
        estado: 'en_preparacion',
        subtotal: 82.00,
        impuestos: 14.00,
        total: 96.00,
        tipo_entrega: 'salon',
        mesa: 'Mesa 1 • Salón Principal',
        notas: 'Término medio en el lomo, cebolla crocante.',
        origen: 'voice_ai',
        prioridad: 'alta',
        detalles: [
          { id_detalle: 9, id_producto: 3, nombre_producto: 'Tallarín Saltado de Lomo', cantidad: 2, precio_unitario: 35.00, subtotal: 70.00 },
          { id_detalle: 10, id_producto: 1, nombre_producto: 'Arroz Chaufa Especial', cantidad: 0.5, precio_unitario: 16.00, subtotal: 16.00 },
          { id_detalle: 11, id_producto: 11, nombre_producto: 'Chicha Morada Clásica de Maíz Morado (1L)', cantidad: 1, precio_unitario: 10.00, subtotal: 10.00 }
        ]
      },
      {
        id_pedido: 1039,
        codigo: '#1039',
        id_cliente: 1,
        cliente_nombre: 'Carlos Mendoza',
        cliente_telefono: '+51 987 654 321',
        id_sesion_voz: 4808,
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:38 PM',
        tiempo_estimado_entrega: 'Preparando (8 min rest.)',
        estado: 'en_preparacion',
        subtotal: 44.00,
        impuestos: 8.00,
        total: 52.00,
        tipo_entrega: 'delivery',
        cliente_direccion: 'Av. Pardo 450, Dpto 602, Miraflores',
        notas: 'Extra frijolito chino al dente.',
        origen: 'voice_ai',
        prioridad: 'normal',
        detalles: [
          { id_detalle: 12, id_producto: 4, nombre_producto: 'Aeropuerto Familiar', cantidad: 1, precio_unitario: 30.00, subtotal: 30.00 },
          { id_detalle: 13, id_producto: 8, nombre_producto: 'Wantán Frito Clásico (12 unidades)', cantidad: 1, precio_unitario: 16.00, subtotal: 16.00 },
          { id_detalle: 14, id_producto: 10, nombre_producto: 'Inka Kola 1L (Helada)', cantidad: 1, precio_unitario: 6.00, subtotal: 6.00 }
        ]
      },
      {
        id_pedido: 1040,
        codigo: '#1040',
        id_cliente: 2,
        cliente_nombre: 'Lucía Salazar',
        cliente_telefono: '+51 912 345 678',
        id_sesion_voz: 4809,
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:40 PM',
        tiempo_estimado_entrega: 'Preparando (3 min rest.)',
        estado: 'en_preparacion',
        subtotal: 55.00,
        impuestos: 9.00,
        total: 64.00,
        tipo_entrega: 'salon',
        mesa: 'Mesa 2 • Salón',
        notas: 'Arroz chaufa blanco y piña glaseada bien caliente.',
        origen: 'voice_ai',
        prioridad: 'normal',
        detalles: [
          { id_detalle: 15, id_producto: 6, nombre_producto: 'Pollo Chi Jau Kay', cantidad: 1, precio_unitario: 29.00, subtotal: 29.00 },
          { id_detalle: 16, id_producto: 2, nombre_producto: 'Pollo Tipa Kay', cantidad: 1, precio_unitario: 28.00, subtotal: 28.00 },
          { id_detalle: 17, id_producto: 10, nombre_producto: 'Inka Kola 1L (Helada)', cantidad: 1, precio_unitario: 7.00, subtotal: 7.00 }
        ]
      },
      {
        id_pedido: 1036,
        codigo: '#1036',
        id_cliente: 4,
        cliente_nombre: 'Carmen Rosa Torres',
        cliente_telefono: '+51 954 321 000',
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:20 PM',
        tiempo_estimado_entrega: 'Listo para despacho',
        estado: 'en_preparacion', // listed in "Listos para Despacho" column
        subtotal: 58.00,
        impuestos: 10.00,
        total: 68.00,
        tipo_entrega: 'delivery',
        cliente_direccion: 'Av. Dos de Mayo 1420, Dpto 502, San Isidro',
        repartidor: 'Jorge Alva (Moto 04)',
        notas: 'Pagado online. Empaquetado y caliente.',
        origen: 'voice_ai',
        detalles: [
          { id_detalle: 18, id_producto: 1, nombre_producto: 'Arroz Chaufa Especial', cantidad: 2, precio_unitario: 32.00, subtotal: 64.00 },
          { id_detalle: 19, id_producto: 7, nombre_producto: 'Sopa Wantán Especial', cantidad: 0.5, precio_unitario: 4.00, subtotal: 4.00 }
        ]
      },
      {
        id_pedido: 1037,
        codigo: '#1037',
        id_cliente: 3,
        cliente_nombre: 'Víctor Hugo Paredes',
        cliente_telefono: '+51 966 777 888',
        fecha_pedido: '2026-11-20',
        hora_pedido: '12:25 PM',
        tiempo_estimado_entrega: 'Listo para despacho',
        estado: 'en_preparacion',
        subtotal: 44.00,
        impuestos: 7.50,
        total: 51.50,
        tipo_entrega: 'delivery',
        cliente_direccion: 'Calle Las Begonias 401, Oficina 801, San Isidro',
        repartidor: 'Manuel Ramos (Moto 02)',
        notas: 'Cobro en efectivo: S/ 51.50. Llevar vuelto de S/ 100.',
        origen: 'web',
        detalles: [
          { id_detalle: 20, id_producto: 5, nombre_producto: 'Kam Lu Wantán Especial', cantidad: 1, precio_unitario: 38.00, subtotal: 38.00 },
          { id_detalle: 21, id_producto: 9, nombre_producto: 'Siu Mai Artesanal al Vapor (6 unidades)', cantidad: 0.75, precio_unitario: 13.50, subtotal: 13.50 }
        ]
      },
      {
        id_pedido: 1030,
        codigo: '#1030',
        id_cliente: 1,
        cliente_nombre: 'Carlos Mendoza',
        cliente_telefono: '+51 987 654 321',
        fecha_pedido: '2026-11-19',
        hora_pedido: '08:15 PM',
        estado: 'entregado',
        subtotal: 24.00,
        impuestos: 4.00,
        total: 28.00,
        tipo_entrega: 'delivery',
        origen: 'voice_ai',
        detalles: [
          { id_detalle: 22, id_producto: 3, nombre_producto: 'Tallarín Saltado de Lomo', cantidad: 1, precio_unitario: 28.00, subtotal: 28.00 }
        ]
      }
    ];
    this.set('pedidos', pedidos);
  }

  private seedClientes(): void {
    const clientes: Cliente[] = [
      {
        id_cliente: 1,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        telefono: '+51 987 654 321',
        email: 'carlos.mendoza@email.pe',
        direccion: 'Av. Pardo 450, Dpto 602',
        distrito: 'Miraflores',
        nivel: 'Oro VIP',
        pedidos_totales: 28,
        gasto_total: 1840.00,
        canal_habitual: 'Voice AI',
        plato_favorito: 'Chaufa Especial + Wantán',
        ultimo_pedido: 'Hoy 12:40 PM',
        puntos_dragon: 1420,
        perfil_voz: {
          acento_detectado: 'Limeño / Rápido',
          preferencias_culinarias: 'Prefiere chaufa poco sillao, ají en pote aparte, sin cebollita china.',
          horario_habitual: 'Almuerzo (12:30 - 1:30 PM)'
        }
      },
      {
        id_cliente: 2,
        nombre: 'Lucía',
        apellido: 'Salazar',
        telefono: '+51 912 345 678',
        email: 'lucia.salazar@peru.com',
        direccion: 'Calle Los Pinos 230',
        distrito: 'San Isidro',
        nivel: 'Frecuente',
        pedidos_totales: 14,
        gasto_total: 920.00,
        canal_habitual: 'Voice AI',
        plato_favorito: 'Pollo Tipakay',
        ultimo_pedido: 'Ayer 7:30 PM',
        puntos_dragon: 780,
        perfil_voz: {
          acento_detectado: 'Estándar',
          preferencias_culinarias: 'Gusta de salsas agridulces y piña fresca.',
          horario_habitual: 'Cena (7:00 - 8:30 PM)'
        }
      },
      {
        id_cliente: 3,
        nombre: 'Jorge',
        apellido: 'Alva',
        telefono: '+51 999 888 777',
        email: 'jorge.alva@gmail.com',
        direccion: 'Jr. Monte Umbroso 140',
        distrito: 'Surco',
        nivel: 'Frecuente',
        pedidos_totales: 11,
        gasto_total: 690.00,
        canal_habitual: 'Web',
        plato_favorito: 'Tallarín Saltado Lomo',
        ultimo_pedido: 'Hace 3 días',
        puntos_dragon: 520,
        perfil_voz: {
          acento_detectado: 'Neutro',
          preferencias_culinarias: 'Tallarines con lomo jugoso y chicha morada.',
          horario_habitual: 'Almuerzo (1:00 PM)'
        }
      },
      {
        id_cliente: 4,
        nombre: 'Ana María',
        apellido: 'Wong',
        telefono: '+51 945 112 233',
        email: 'am.wong@empresa.com.pe',
        direccion: 'Av. San Borja Sur 890',
        distrito: 'San Borja',
        nivel: 'Oro VIP',
        pedidos_totales: 22,
        gasto_total: 1410.00,
        canal_habitual: 'Voice AI',
        plato_favorito: 'Aeropuerto Especial',
        ultimo_pedido: 'Hoy 1:15 PM',
        puntos_dragon: 1180,
        perfil_voz: {
          acento_detectado: 'Cantones-Peruano',
          preferencias_culinarias: 'Conocedora experta del Wok Hei, pide puntos exactos de cocción.',
          horario_habitual: 'Fines de semana y almuerzos familiares'
        }
      },
      {
        id_cliente: 5,
        nombre: 'Diego',
        apellido: 'Morales',
        telefono: '+51 933 221 144',
        email: 'diego.morales@outlook.com',
        direccion: 'Jr. Bolognesi 345',
        distrito: 'Magdalena',
        nivel: 'Nuevo',
        pedidos_totales: 2,
        gasto_total: 115.00,
        canal_habitual: 'Voice AI',
        plato_favorito: 'Kam Lu Wantán',
        ultimo_pedido: 'Esta semana',
        puntos_dragon: 115,
        perfil_voz: {
          acento_detectado: 'Juvenil / Urbano',
          preferencias_culinarias: 'Le gustan los wantanes crujientes y comida abundante bien taipá.',
          horario_habitual: 'Noches de fin de semana'
        }
      }
    ];
    this.set('clientes', clientes);
  }

  private seedSesionesVoz(): void {
    const sesiones: SesionVoz[] = [
      {
        id_sesion: 4812,
        codigo_llamada: '#CW-4812',
        id_cliente: 1,
        cliente_nombre: 'Carlos Mendoza',
        ubicacion: 'Miraflores • Web Desktop',
        canal: 'Voice AI Web',
        fecha: '2026-11-20',
        hora: '12:43 PM',
        hace_tiempo: 'Hace 4 min',
        duracion_segundos: 36,
        exitosa: true,
        confianza: 99.1,
        transcripcion_usuario: 'Quiero un arroz chaufa especial con poco sillao y dos Inka Kola heladas al toque por favor.',
        respuesta_mei: '¡Excelente elección! He añadido a tu pedido 1 Arroz Chaufa Especial con poco sillao y 2 Inka Kola de 1L bien heladas. ¿Deseas agregar una porción de wantán frito crocante?',
        platos_identificados: ['Arroz Chaufa Especial', 'Inka Kola 1L (x2)'],
        modificadores_jerga: ['Poco sillao', 'Al toque (Prioridad Alta)'],
        pedido_asociado_codigo: '#1042',
        estado: 'finalizada'
      },
      {
        id_sesion: 4811,
        codigo_llamada: '#CW-4811',
        id_cliente: 5,
        cliente_nombre: 'Diego Morales',
        ubicacion: 'San Isidro • Móvil',
        canal: 'Voice AI Móvil',
        fecha: '2026-11-20',
        hora: '12:39 PM',
        hace_tiempo: 'Hace 11 min',
        duracion_segundos: 48,
        exitosa: true,
        confianza: 98.6,
        transcripcion_usuario: 'Mándame un Aeropuerto de pollo bien taipá, sin cebollita china y harto ají.',
        respuesta_mei: 'Entendido, prepararemos un Aeropuerto de pollo generoso bien taipá, sin cebollita china y con harto ají chifero en pote aparte. ¿Te gustaría una bebida para acompañar?',
        platos_identificados: ['Aeropuerto Familiar'],
        modificadores_jerga: ['Bien taipá (Porción generosa)', 'Sin cebollita china', 'Harto ají'],
        pedido_asociado_codigo: '#1043',
        estado: 'finalizada'
      },
      {
        id_sesion: 4810,
        codigo_llamada: '#CW-4810',
        id_cliente: 3,
        cliente_nombre: 'Jorge Alva',
        ubicacion: 'Surco • Móvil',
        canal: 'Voice AI Móvil',
        fecha: '2026-11-20',
        hora: '12:31 PM',
        hace_tiempo: 'Hace 18 min',
        duracion_segundos: 29,
        exitosa: true,
        confianza: 99.4,
        transcripcion_usuario: 'Un Pollo Tipakay con arroz chaufa y una docena de wantanes fritos con tamarindo.',
        respuesta_mei: 'Perfecto, anotado: 1 Pollo Tipakay con chaufa y 1 docena de Wantanes Fritos con salsa tamarindo artesanal. Total S/ 44.00. ¿Confirmamos el despacho?',
        platos_identificados: ['Pollo Tipa Kay', 'Wantán Frito Clásico (12 unidades)'],
        modificadores_jerga: ['Con tamarindo'],
        pedido_asociado_codigo: '#1039',
        estado: 'finalizada'
      }
    ];
    this.set('sesiones_voz', sesiones);
  }

  private seedUsuarios(): void {
    const usuarios: Usuario[] = [
      {
        id: 1,
        nombre: 'Carlos',
        apellido: 'Wong (Chef & Admin)',
        email: 'gerencia@chifawok.pe',
        rol: 'ADMIN',
        token: 'mock-jwt-admin-token-chifawok-secret-2025'
      },
      {
        id: 2,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        email: 'carlos.mendoza@email.pe',
        telefono: '+51 987 654 321',
        direccion: 'Av. Pardo 450, Dpto 602, Miraflores',
        rol: 'CLIENTE',
        token: 'mock-jwt-cliente-token-carlos-mendoza-2025'
      }
    ];
    this.set('usuarios', usuarios);
  }
}
