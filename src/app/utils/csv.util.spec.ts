import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirCsv } from './csv.util';

test('construirCsv separa con punto y coma y escapa comillas, separadores y saltos', () => {
  const csv = construirCsv([
    ['Cliente', 'Nota', 'Total'],
    ['Carlos Mendoza', 'Sin "cebollita"; bien taipá', 73],
    ['Lucía', 'línea 1\nlínea 2', null]
  ]);
  assert.equal(csv, 'Cliente;Nota;Total\r\nCarlos Mendoza;"Sin ""cebollita""; bien taipá";73\r\nLucía;"línea 1\nlínea 2";');
});
