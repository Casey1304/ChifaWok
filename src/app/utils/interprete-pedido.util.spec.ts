import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  interpretarPedido, tokenizarPedido, claveFonetica, similitud,
  UMBRAL_ALTO, UMBRAL_MEDIO, ResultadoInterpretacion
} from './interprete-pedido.util';
import { Producto } from '../models/producto.model';

// Carta de demostración: mismos nombres, categorías y sinónimos que StorageService.seedProductos.
const p = (id_producto: number, nombre: string, precio: number, categoria_nombre: string, sinonimos_voz: string[], disponible = true): Producto => ({
  id_producto, nombre, precio, categoria_nombre, sinonimos_voz, disponible,
  id_categoria: 0, descripcion: '', stock: 10, imagen: ''
});
const CARTA: Producto[] = [
  p(1, 'Arroz Chaufa Especial', 32, 'Chaufas', ['chaufa especial', 'arroz chaufa', 'chaufa mixto', 'chaufa con todo']),
  p(2, 'Pollo Tipa Kay', 28, 'Especialidades', ['tipakay', 'pollo agridulce', 'pollo con piña', 'tipa kay']),
  p(3, 'Tallarín Saltado de Lomo', 35, 'Saltados', ['tallarin saltado', 'tallarines con lomo', 'saltado de fideos']),
  p(4, 'Aeropuerto Familiar', 30, 'Chaufas', ['aeropuerto', 'arroz aeropuerto', 'aeropuerto mixto', 'aeropuerto de pollo']),
  p(5, 'Kam Lu Wantán Especial', 38, 'Especialidades', ['kam lu wantan', 'wantan agridulce', 'kamlu']),
  p(6, 'Pollo Chi Jau Kay', 29, 'Especialidades', ['chijaukay', 'pollo chi jau kay', 'chi jau kai']),
  p(7, 'Sopa Wantán Especial', 22, 'Sopas & Entradas', ['sopa wantan', 'sopa wantan especial', 'sopa chifa']),
  p(8, 'Wantán Frito Clásico (12 unidades)', 16, 'Sopas & Entradas', ['wantan frito', 'wantanes', 'docena de wantanes']),
  p(9, 'Siu Mai Artesanal al Vapor (6 unidades)', 18, 'Sopas & Entradas', ['siu mai', 'shiu mai', 'dim sum']),
  p(10, 'Inka Kola 1L (Helada)', 9, 'Bebidas', ['inka kola', 'inca kola', 'gaseosa helada', 'inka kola de litro']),
  p(11, 'Chicha Morada Clásica de Maíz Morado (1L)', 10, 'Bebidas', ['chicha', 'chicha morada', 'jarra de chicha'])
];

const interpretar = (texto: string, carta = CARTA) => interpretarPedido(texto, carta);
/** Ítems reconocidos con certeza como { idProducto: cantidad }. */
const items = (r: ResultadoInterpretacion) => Object.fromEntries(r.items.map(i => [i.producto.id_producto, i.cantidad]));
const resumen = (texto: string) => items(interpretar(texto));
const ids = (r: ResultadoInterpretacion, n = 0) => r.dudas[n].opciones.map(o => o.producto.id_producto);

// ---------- Tokenización y clave fonética ----------

test('tokenizar normaliza tildes, plurales y variantes de transcripción', () => {
  assert.deepEqual(tokenizarPedido('Dos Chaufas Especiales, una Inca Cola'), ['dos', 'chaufa', 'especial', ',', 'una', 'inka', 'kola']);
  assert.deepEqual(tokenizarPedido('tres Inca Colas'), ['tres', 'inka', 'kola']);
  assert.deepEqual(tokenizarPedido('tres tallarines'), ['tres', 'tallarin']);
});

test('la clave fonética iguala variantes de transcripción de un mismo plato', () => {
  const clave = (t: string) => claveFonetica(tokenizarPedido(t));
  assert.equal(clave('pollo tip packay'), clave('pollo tipa kay'));
  assert.equal(clave('pollo tipa kai'), clave('pollo tipakay'));
  assert.equal(clave('chi hau kai'), clave('chi jau kay'));
  assert.equal(clave('taya rin saltado'), clave('tallarin saltado'));
});

// ---------- Calibración de umbrales con la carta real ----------

test('calibración: términos de platos distintos nunca alcanzan el umbral alto', () => {
  const claves = CARTA.map(prod => [prod.nombre.replace(/\(.*?\)/g, ''), ...(prod.sinonimos_voz || [])]
    .map(t => claveFonetica(tokenizarPedido(t))));
  let maxima = 0;
  for (let a = 0; a < claves.length; a++) {
    for (let b = a + 1; b < claves.length; b++) {
      for (const x of claves[a]) for (const y of claves[b]) maxima = Math.max(maxima, similitud(x, y), similitud(y, x));
    }
  }
  // Medido: 0.737 (Kam Lu Wantán ↔ Sopa Wantán) y 0.727 (Tipa Kay ↔ Chi Jau Kay).
  assert.ok(maxima < UMBRAL_ALTO, `similitud máxima entre platos distintos ${maxima} debe ser < ${UMBRAL_ALTO}`);
});

test('calibración: errores de transcripción superan el umbral alto y el ruido queda bajo el medio', () => {
  const mejor = (t: string) => {
    const k = claveFonetica(tokenizarPedido(t));
    return Math.max(...CARTA.flatMap(prod => [prod.nombre.replace(/\(.*?\)/g, ''), ...(prod.sinonimos_voz || [])]
      .map(x => similitud(k, claveFonetica(tokenizarPedido(x))))));
  };
  for (const e of ['pollo tip packay', 'tallarin saltao', 'chicha moraa', 'kam lu guantan', 'siu may']) {
    assert.ok(mejor(e) >= UMBRAL_ALTO, `"${e}" (${mejor(e)}) debería ser coincidencia alta`);
  }
  for (const ruido of ['hicieron', 'quisiera', 'lasaña', 'ceviche', 'pizza']) {
    assert.ok(mejor(ruido) < UMBRAL_MEDIO, `"${ruido}" (${mejor(ruido)}) no debería sugerir platos`);
  }
});

// ---------- Casos pedidos para la exposición ----------

test('1. "Quiero un pollo tip packay" propone Pollo Tipa Kay para confirmar', () => {
  const r = interpretar('Quiero un pollo tip packay');
  assert.equal(r.items.length, 0, 'una coincidencia aproximada nunca se agrega sin confirmar');
  assert.equal(r.dudas.length, 1);
  assert.equal(r.dudas[0].tipo, 'probable');
  assert.equal(r.dudas[0].cantidad, 1);
  assert.equal(ids(r)[0], 2);
});

test('caso real: "hicieron pollo tip packay" propone Pollo Tipa Kay e ignora la palabra mal transcrita', () => {
  const r = interpretar('hicieron pollo tip packay');
  assert.equal(r.dudas.length, 1);
  assert.equal(r.dudas[0].tipo, 'probable');
  assert.equal(ids(r)[0], 2);
  assert.deepEqual(r.noReconocidos, []);
});

test('2. "Dame dos pollos tipa kai": variante del diccionario de alias, se agrega con su cantidad', () => {
  assert.deepEqual(resumen('Dame dos pollos tipa kai'), { 2: 2 });
  // Variante no registrada como alias: se propone y se conserva la cantidad.
  const r = interpretar('Dame dos pollos tip packay');
  assert.equal(r.dudas[0].tipo, 'probable');
  assert.equal(r.dudas[0].cantidad, 2);
  assert.equal(ids(r)[0], 2);
});

test('3 y 4. chaufa especial exacto en singular y plural', () => {
  assert.deepEqual(resumen('Quiero un chaufa especial'), { 1: 1 });
  assert.deepEqual(resumen('Dame tres chaufas especiales'), { 1: 3 });
});

test('5. "Dos inca colas" se reconoce directamente', () => {
  assert.deepEqual(resumen('Dos inca colas'), { 10: 2 });
});

test('6. "Quiero un pollo" muestra los platos de pollo de la carta', () => {
  const r = interpretar('Quiero un pollo');
  assert.equal(r.items.length, 0);
  assert.equal(r.dudas[0].tipo, 'ambiguo');
  assert.deepEqual([...ids(r)].sort(), [2, 4, 6]);
});

test('7. "Dame dos chaufas y un pollo tipakay": solo pregunta por el chaufa y conserva cantidades', () => {
  const r = interpretar('Dame dos chaufas y un pollo tipakay');
  assert.deepEqual(items(r), { 2: 1 });
  assert.equal(r.dudas.length, 1);
  assert.equal(r.dudas[0].cantidad, 2);
  assert.deepEqual([...ids(r)].sort(), [1, 4]);
});

test('pedido múltiple con un plato dudoso conserva los demás', () => {
  const r = interpretar('Quiero dos chaufas especiales, un pollo tip packay y tres Inka Kolas');
  assert.deepEqual(items(r), { 1: 2, 10: 3 });
  assert.equal(r.dudas.length, 1);
  assert.equal(r.dudas[0].cantidad, 1);
  assert.equal(ids(r)[0], 2);
});

test('8. producto inexistente: no se inventa; se informa con alternativas de la familia', () => {
  const r = interpretar('Quisiera tres chaufas de pollo');
  assert.equal(r.items.length, 0);
  assert.equal(r.dudas[0].tipo, 'no_existe');
  assert.equal(r.dudas[0].texto, 'chaufa de pollo');
  assert.equal(r.dudas[0].cantidad, 3);
  assert.deepEqual(interpretar('dos lasañas').noReconocidos, ['lasana']);
  const lomo = interpretar('un lomo saltado');
  assert.equal(lomo.items.length, 0, '"lomo saltado" no debe convertirse en Tallarín sin preguntar');
  assert.equal(lomo.dudas[0].tipo, 'no_existe');
});

test('9. frases incompletas o sin pedido no generan ítems ni sugerencias falsas', () => {
  for (const frase of ['quiero', 'hola mei, buenas tardes', 'para llevar por favor', 'dame dos']) {
    const r = interpretar(frase);
    assert.equal(r.items.length, 0, frase);
    assert.equal(r.dudas.length, 0, frase);
  }
});

// ---------- Regresiones previas ----------

test('frases exactas de la exposición: cantidades correctas por producto', () => {
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

test('platos pausados no se agregan ni se sugieren, y se informan', () => {
  const carta = CARTA.map(x => x.id_producto === 10 ? { ...x, disponible: false } : x);
  const r = interpretar('un chaufa especial y una inka kola', carta);
  assert.deepEqual(r.items.map(i => i.producto.id_producto), [1]);
  assert.deepEqual(r.noDisponibles.map(x => x.id_producto), [10]);
  const aproximado = interpretar('una inka colla', carta);
  assert.ok(aproximado.dudas.every(d => d.opciones.every(o => o.producto.id_producto !== 10)));
});

test('"para la mesa 4 un aeropuerto" no confunde el número de mesa con una cantidad de plato', () => {
  assert.deepEqual(resumen('para la mesa 4 un aeropuerto'), { 4: 1 });
});
