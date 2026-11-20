/**
 * Hash de contraseñas para las cuentas registradas en el modo demostración.
 *
 * Usa SHA-256 (Web Crypto) con una sal aleatoria por usuario para no guardar la
 * contraseña en texto plano. Es una protección demostrativa: al vivir en
 * LocalStorage no sustituye a la autenticación de un backend real.
 */

function aHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generarSal(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return aHex(bytes.buffer);
}

export async function hashPassword(password: string, sal: string): Promise<string> {
  const datos = new TextEncoder().encode(`${sal}:${password}`);
  return aHex(await crypto.subtle.digest('SHA-256', datos));
}

export async function verificarPassword(password: string, sal: string, hashEsperado: string): Promise<boolean> {
  return (await hashPassword(password, sal)) === hashEsperado;
}
