import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarProductos } from './filtros.util';
import { Producto } from '../models/producto.model';

const base = { precio: 10, stock: 10, disponible: true, imagen: '' };
const productos: Producto[] = [
  { ...base, id_producto: 1, nombre: 'Arroz Chaufa Especial', descripcion: 'Arroz al wok', id_categoria: 2, categoria_nombre: 'Chaufas' },
  { ...base, id_producto: 3, nombre: 'Tallarín Saltado de Lomo', descripcion: 'Fideos al wok', id_categoria: 3, categoria_nombre: 'Saltados' },
  { ...base, id_producto: 8, nombre: 'Sopa Wantán', descripcion: 'Caldo con fideos', id_categoria: 4, categoria_nombre: 'Sopas & Entradas', sinonimos_voz: ['sopa wantan'] },
  { ...base, id_producto: 10, nombre: 'Inka Kola 1L', descripcion: 'Gaseosa', id_categoria: 5, categoria_nombre: 'Bebidas' }
];
const ids = (list: Producto[]) => list.map(p => p.id_producto);

test('sin filtros devuelve todos los productos', () => {
  assert.deepEqual(ids(filtrarProductos(productos, null, '')), [1, 3, 8, 10]);
});

test('filtra solo por categoría', () => {
  assert.deepEqual(ids(filtrarProductos(productos, 3, '')), [3]);
  assert.deepEqual(ids(filtrarProductos(productos, 5, '')), [10]);
});

test('búsqueda ignora tildes y mayúsculas en nombre, descripción y categoría', () => {
  assert.deepEqual(ids(filtrarProductos(productos, null, 'tallarin')), [3]);
  assert.deepEqual(ids(filtrarProductos(productos, null, 'FIDEOS')), [3, 8]);
  assert.deepEqual(ids(filtrarProductos(productos, null, 'bebidas')), [10]);
});

test('categoría y búsqueda se combinan', () => {
  assert.deepEqual(ids(filtrarProductos(productos, 3, 'tallarin')), [3]);
  assert.deepEqual(ids(filtrarProductos(productos, 4, 'fideos')), [8]);
  assert.deepEqual(ids(filtrarProductos(productos, 5, 'tallarin')), []);
});

test('no modifica la lista original', () => {
  const copia = JSON.stringify(productos);
  filtrarProductos(productos, 2, 'zzz');
  assert.equal(JSON.stringify(productos), copia);
});
