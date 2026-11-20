/**
 * Utilidades de texto compartidas por los buscadores de la aplicación.
 *
 * `normalizarTexto` elimina tildes/diacríticos, convierte a minúsculas y
 * colapsa espacios, de modo que "Tallarín" y "tallarin" se consideren iguales.
 */
export function normalizarTexto(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Indica si el término de búsqueda aparece en alguno de los campos indicados.
 * Un término vacío coincide siempre (no filtra).
 */
export function coincideBusqueda(
  termino: string,
  campos: ReadonlyArray<string | number | null | undefined>
): boolean {
  const term = normalizarTexto(termino);
  if (!term) return true;
  return campos.some(campo => normalizarTexto(campo).includes(term));
}
