import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarSal, hashPassword, verificarPassword } from './hash.util';

test('el hash no contiene la contraseña y depende de la sal', async () => {
  const sal1 = generarSal();
  const sal2 = generarSal();
  assert.notEqual(sal1, sal2);
  const h1 = await hashPassword('Rosa2026', sal1);
  const h2 = await hashPassword('Rosa2026', sal2);
  assert.match(h1, /^[0-9a-f]{64}$/);
  assert.ok(!h1.includes('Rosa2026'));
  assert.notEqual(h1, h2);
});

test('verificarPassword acepta la contraseña correcta y rechaza otras', async () => {
  const sal = generarSal();
  const hash = await hashPassword('Rosa2026', sal);
  assert.equal(await verificarPassword('Rosa2026', sal, hash), true);
  assert.equal(await verificarPassword('rosa2026', sal, hash), false);
  assert.equal(await verificarPassword('', sal, hash), false);
});
