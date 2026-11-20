import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretarPedido, tokenizarPedido } from './interprete-pedido.util';
import { Producto } from '../models/producto.model';

// Carta de demostración (mismos nombres y sinónimos que StorageService.seedProductos).
const p = (id_producto: number, nombre: string, precio: number, id_categoria: number, sinonimos_voz: string[], disponible = true): Producto => ({
  id_producto, nombre, precio, id_categoria, sinonimos_voz, disponible,
  descripcion: '', stock: 10, categoria_nombre: '', imagen: ''
});
const CARTA: Producto[] = [
  p(1, 'Arroz Chaufa Especial', 32, 2, ['chaufa especial', 'arroz chaufa', 'chaufa mixto', 'chaufa con todo']),
  p(2, 'Pollo Tipa Kay', 28, 1, ['tipakay', 'pollo agridulce', 'pollo con piña', 'tipa kay']),
  p(3, 'Tallarín Saltado de Lomo', 35, 3, ['tallarin saltado', 'tallarines con lomo', 'saltado de fideos']),
  p(4, 'Aeropuerto Familiar', 30, 2, ['aeropuerto', 'arroz aeropuerto', 'aeropuerto mixto', 'aeropuerto de pollo']),
  p(5, 'Kam Lu Wantán Especial', 38, 1, ['kam lu wantan', 'wantan agridulce', 'kamlu']),
  p(6, 'Pollo Chi Jau Kay', 29, 1, ['chijaukay', 'pollo chi jau kay', 'chi jau kai']),
  p(7, 'Sopa Wantán Especial', 22, 4, ['sopa wantan', 'sopa wantan especial', 'sopa chifa']),
  p(8, 'Wantán Frito Clásico (12 unidades)', 16, 4, ['wantan frito', 'wantanes', 'docena de wantanes']),
  p(9, 'Siu Mai Artesanal al Vapor (6 unidades)', 18, 4, ['siu mai', 'shiu mai', 'dim sum']),
  p(10, 'Inka Kola 1L (Helada)', 9, 5, ['inka kola', 'inca kola', 'gaseosa helada', 'inka kola de litro']),
  p(11, 'Chicha Morada Clásica de Maíz Morado (1L)', 10, 5, ['chicha', 'chicha morada', 'jarra de chicha'])
];

/** Resume el resultado como { idProducto: cantidad }. */
const resumen = (texto: string, carta = CARTA) =>
  Object.fromEntries(interpretarPedido(texto, carta).items.map(i => [i.producto.id_producto, i.cantidad]));

test('tokenizar normaliza tildes, plurales y variantes de transcripción', () => {
  assert.deepEqual(tokenizarPedido('Dos Chaufas Especiales, una Inca Cola'), ['dos', 'chaufa', 'especial', ',', 'una', 'inka', 'kola']);
  assert.deepEqual(tokenizarPedido('tres tallarines'), ['tres', 'tallarin']);
});

test('frases de la exposición: cantidades correctas por producto', () => {
  assert.deepEqual(resumen('Quiero dos chaufas especiales y una Inka Kola'), { 1: 2, 10: 1 });
  assert.deepEqual(resumen('Dame un tallarín saltado y dos gaseosas'), { 3: 1, 10: 2 });
  assert.deepEqual(resumen('Quiero un chaufa especial y una sopa'), { 1: 1, 7: 1 });
});

test('regresión: no invierte cantidades entre productos', () => {
  assert.deepEqual(resumen('quiero 2 chaufa especial y 1 inka kola para llevar'), { 1: 2, 10: 1 });
  assert.deepEqual(resumen('1 inka kola y 2 chaufa especial'), { 10: 1, 1: 2 });
  assert.deepEqual(resumen('dame un tallarín saltado, dos tipakay y tres inka kola'), { 3: 1, 2: 2, 10: 3 });
});

test('cantidades en palabras y números, sin separador "y"', () => {
  assert.deepEqual(resumen('cinco siu mai'), { 9: 5 });
  assert.deepEqual(resumen('quiero 4 aeropuertos familiares 2 chichas moradas'), { 4: 4, 11: 2 });
  assert.deepEqual(resumen('una sopa de wantan y media docena de wantanes'), { 7: 1, 8: 0.5 });
});

test('mismo plato mencionado dos veces suma cantidades', () => {
  assert.deepEqual(resumen('un chaufa especial y otro chaufa especial'), { 1: 2 });
});

test('no inventa platos: "chaufa de pollo" no existe en la carta', () => {
  const r = interpretarPedido('Quisiera tres chaufas de pollo', CARTA);
  assert.equal(r.items.length, 0);
  assert.deepEqual(r.noReconocidos, ['chaufa de pollo']);
});

test('términos genéricos con varias opciones se marcan como ambiguos', () => {
  const r = interpretarPedido('quiero dos pollos', CARTA);
  assert.equal(r.items.length, 0);
  assert.equal(r.ambiguos.length, 1);
  assert.equal(r.ambiguos[0].cantidad, 2);
  assert.deepEqual(r.ambiguos[0].opciones.map(o => o.id_producto).sort(), [2, 4, 6]);
});

test('reporta productos fuera de la carta y conserva lo reconocido', () => {
  const r = interpretarPedido('dos lasañas y un chaufa especial', CARTA);
  assert.deepEqual(r.items.map(i => [i.producto.id_producto, i.cantidad]), [[1, 1]]);
  assert.deepEqual(r.noReconocidos, ['lasana']);
});

test('platos pausados no se agregan y se informan', () => {
  const carta = CARTA.map(x => x.id_producto === 10 ? { ...x, disponible: false } : x);
  const r = interpretarPedido('un chaufa especial y una inka kola', carta);
  assert.deepEqual(r.items.map(i => i.producto.id_producto), [1]);
  assert.deepEqual(r.noDisponibles.map(x => x.id_producto), [10]);
});

test('frases sin pedido no generan ítems ni falsos positivos', () => {
  const r = interpretarPedido('hola mei, buenas tardes', CARTA);
  assert.equal(r.items.length, 0);
  assert.equal(r.noReconocidos.length, 0);
  assert.deepEqual(resumen('para la mesa 4 un aeropuerto'), { 4: 1 });
});
