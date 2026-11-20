/** Tasa del IGV en Perú. */
export const TASA_IGV = 0.18;

export interface Totales {
  /** Operación gravada: importe sin IGV. */
  subtotal: number;
  /** IGV contenido en el total. */
  impuestos: number;
  /** Importe a pagar: suma de los precios de la carta. */
  total: number;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Los precios de la carta ya incluyen IGV (precio final al consumidor).
 * Se desglosa el impuesto contenido: total = suma de precios, subtotal = total / 1.18.
 */
export function calcularTotales(importeConIgv: number): Totales {
  const total = redondear(importeConIgv);
  const subtotal = redondear(total / (1 + TASA_IGV));
  return { subtotal, impuestos: redondear(total - subtotal), total };
}
