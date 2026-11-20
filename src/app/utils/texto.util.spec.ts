import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarTexto, coincideBusqueda } from './texto.util';

test('normalizarTexto elimina tildes, mayúsculas y espacios sobrantes', () => {
  assert.equal(normalizarTexto('  Tallarín   SALTADO '), 'tallarin saltado');
  assert.equal(normalizarTexto('Wantán Ñoño'), 'wantan nono');
  assert.equal(normalizarTexto(null), '');
  assert.equal(normalizarTexto(undefined), '');
  assert.equal(normalizarTexto(987), '987');
});

test('coincideBusqueda: "tallarin" encuentra "Tallarín"', () => {
  assert.equal(coincideBusqueda('tallarin', ['Tallarín Saltado de Lomo']), true);
  assert.equal(coincideBusqueda('TALLARÍN', ['tallarin saltado']), true);
});

test('coincideBusqueda: término vacío no filtra', () => {
  assert.equal(coincideBusqueda('', ['Lo que sea']), true);
  assert.equal(coincideBusqueda('   ', []), true);
});

test('coincideBusqueda: sin coincidencias devuelve false e ignora campos nulos', () => {
  assert.equal(coincideBusqueda('pizza', ['Arroz Chaufa', null, undefined]), false);
});
