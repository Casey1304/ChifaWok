import { test } from 'node:test';
import assert from 'node:assert/strict';
import { returnUrlPermitida } from './navegacion.util';

test('acepta rutas internas válidas', () => {
  assert.equal(returnUrlPermitida('/mis-pedidos', false), '/mis-pedidos');
  assert.equal(returnUrlPermitida('/admin/productos', true), '/admin/productos');
});

test('un comensal nunca es redirigido al panel admin (evita ciclo guard → login)', () => {
  assert.equal(returnUrlPermitida('/admin/pedidos', false), null);
});

test('rechaza URLs vacías, externas o hacia login/registro', () => {
  assert.equal(returnUrlPermitida(null, true), null);
  assert.equal(returnUrlPermitida('', true), null);
  assert.equal(returnUrlPermitida('https://malicioso.example', true), null);
  assert.equal(returnUrlPermitida('//malicioso.example', true), null);
  assert.equal(returnUrlPermitida('/login?returnUrl=/admin', true), null);
  assert.equal(returnUrlPermitida('/registro', false), null);
});
