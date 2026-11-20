import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularTotales } from './totales.util';

test('caso CP-04: dos chaufas especiales y una Inka Kola cuestan S/ 73.00 con IGV incluido', () => {
  const t = calcularTotales(2 * 32 + 9);
  assert.equal(t.total, 73);
  assert.equal(t.subtotal, 61.86);
  assert.equal(t.impuestos, 11.14);
});

test('subtotal + IGV siempre suma el total exacto', () => {
  for (const monto of [0, 9, 16.5, 99, 154.58, 1234.56]) {
    const t = calcularTotales(monto);
    assert.equal(Math.round((t.subtotal + t.impuestos) * 100) / 100, t.total);
  }
});
