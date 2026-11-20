/** Construye un CSV (separador ";" para Excel en español) escapando comillas y saltos de línea. */
export function construirCsv(filas: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>): string {
  return filas
    .map(fila => fila.map(celda => {
      const texto = celda === null || celda === undefined ? '' : String(celda);
      return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    }).join(';'))
    .join('\r\n');
}

/** Descarga un CSV en el navegador (con BOM para que Excel respete las tildes). */
export function descargarCsv(nombreArchivo: string, filas: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>): void {
  const blob = new Blob(['﻿' + construirCsv(filas)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
