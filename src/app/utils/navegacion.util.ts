/**
 * Devuelve la URL de retorno tras el login solo si es una ruta interna que el rol
 * autenticado puede visitar. Evita redirecciones externas y que un comensal sea
 * enviado a /admin (lo que provocaría el ciclo guard → login).
 */
export function returnUrlPermitida(returnUrl: string | null | undefined, esAdmin: boolean): string | null {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) return null;
  if (returnUrl.startsWith('/login') || returnUrl.startsWith('/registro')) return null;
  if (returnUrl.startsWith('/admin') && !esAdmin) return null;
  return returnUrl;
}
