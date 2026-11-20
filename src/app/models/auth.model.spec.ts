import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_CREDENCIALES, PASSWORD_MIN_LENGTH } from './auth.model';

// Regresión: la contraseña demo del Comensal VIP ("123") no cumplía la longitud mínima,
// el formulario quedaba inválido y el reingreso tras cerrar sesión era imposible.
test('las contraseñas demo cumplen la longitud mínima del formulario de login', () => {
  for (const [rol, cred] of Object.entries(DEMO_CREDENCIALES)) {
    assert.ok(
      cred.password.length >= PASSWORD_MIN_LENGTH,
      `La contraseña demo de ${rol} debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
    );
  }
});

test('los correos demo tienen formato válido y son distintos', () => {
  const emails = Object.values(DEMO_CREDENCIALES).map(c => c.email);
  emails.forEach(e => assert.match(e, /^[^@\s]+@[^@\s]+\.[^@\s]+$/));
  assert.equal(new Set(emails).size, emails.length);
});
