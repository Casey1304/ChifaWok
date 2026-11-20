import { Producto } from '../models/producto.model';
import { normalizarTexto } from './texto.util';

/**
 * Intérprete de pedidos en lenguaje natural para Mei (reglas locales, sin IA externa).
 *
 * Recibe el texto reconocido por la Web Speech API (o escrito por el comensal) y lo
 * contrasta con la carta real. Nunca inventa platos: lo que no reconoce o resulta
 * ambiguo se devuelve aparte para que Mei solicite una aclaración.
 */

export interface ItemInterpretado {
  producto: Producto;
  cantidad: number;
}

export interface AmbiguedadPedido {
  /** Palabra genérica dicha por el comensal (p. ej. "pollo"). */
  termino: string;
  cantidad: number;
  opciones: Producto[];
}

export interface ResultadoInterpretacion {
  items: ItemInterpretado[];
  /** Fragmentos con cantidad que no corresponden a ningún plato de la carta. */
  noReconocidos: string[];
  /** Platos de la carta mencionados que hoy están pausados o agotados. */
  noDisponibles: Producto[];
  ambiguos: AmbiguedadPedido[];
}

const NUMEROS: Readonly<Record<string, number>> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, par: 2
};

/** Palabras que separan un ítem del siguiente. */
const SEPARADORES = new Set([',', 'y', 'e', 'mas', 'ademas', 'tambien', 'luego', 'otro', 'otra']);

/** Palabras sin valor de producto (verbos de pedido, cortesía, modalidad, jerga). */
const RELLENO = new Set([
  'quiero', 'quisiera', 'dame', 'deme', 'me', 'das', 'da', 'traeme', 'trae', 'pideme', 'pedir', 'pido',
  'por', 'favor', 'porfa', 'porfavor', 'para', 'llevar', 'delivery', 'mesa', 'en', 'la', 'el', 'lo',
  'los', 'las', 'de', 'del', 'a', 'al', 'con', 'sin', 'bien', 'helada', 'heladito', 'heladita', 'toque',
  'cebollita', 'cebolla', 'china', 'harto', 'aji', 'aparte', 'poco', 'sillao', 'taipa', 'rapido',
  'urgente', 'hola', 'mei', 'buena', 'bueno', 'buenas', 'tarde', 'noche', 'dia', 'gracia', 'nada',
  'eso', 'seria', 'todo', 'tambien', 'porcion', 'orden', 'ordenar', 'pedido', 'que', 'yo', 'nosotro',
  'litro', 'medio', 'grande', 'persona', 'favorcito', 'tu', 'te', 'puede', 'podria', 'mandar', 'enviar', 'personal', 'familiar', 'extra', 'ahora', 'ya', 'si', 'no', 'ok', 'okay'
]);

/** Variantes frecuentes de transcripción → forma usada en la carta. */
const ALIAS: ReadonlyArray<[RegExp, string]> = [
  [/\binca\b/g, 'inka'],
  [/\binka cola\b/g, 'inka kola'],
  [/\b(chau fa|chofa|shaufa|chaufa)\b/g, 'chaufa'],
  [/\b(wan tan|won ton|wonton|guantan|wantan)\b/g, 'wantan'],
  [/\btipa kai\b/g, 'tipa kay'],
  [/\b(shiu mai|siu may|shu mai)\b/g, 'siu mai'],
  [/\btallarines\b/g, 'tallarin'],
  [/\bfideos\b/g, 'fideo']
];

/**
 * Términos genéricos que el comensal suele usar en lugar del nombre exacto.
 * Se resuelven contra la carta: si hay una sola opción se usa; si hay varias, se pregunta.
 */
const GENERICOS: ReadonlyArray<{ palabra: string; coincide: (terminos: string[]) => boolean }> = [
  { palabra: 'chaufa', coincide: t => t.some(x => x.includes('chaufa')) },
  { palabra: 'arroz', coincide: t => t.some(x => x.includes('chaufa') || x.includes('arroz')) },
  { palabra: 'sopa', coincide: t => t.some(x => x.includes('sopa')) },
  { palabra: 'gaseosa', coincide: t => t.some(x => x.includes('kola') || x.includes('gaseosa')) },
  { palabra: 'kola', coincide: t => t.some(x => x.includes('kola')) },
  { palabra: 'chicha', coincide: t => t.some(x => x.includes('chicha')) },
  { palabra: 'bebida', coincide: t => t.some(x => x.includes('kola') || x.includes('chicha')) },
  { palabra: 'refresco', coincide: t => t.some(x => x.includes('kola') || x.includes('chicha')) },
  { palabra: 'tallarin', coincide: t => t.some(x => x.includes('tallarin')) },
  { palabra: 'saltado', coincide: t => t.some(x => x.includes('saltado')) },
  { palabra: 'wantan', coincide: t => t.some(x => x.includes('wantan')) },
  { palabra: 'pollo', coincide: t => t.some(x => x.includes('pollo')) },
  { palabra: 'aeropuerto', coincide: t => t.some(x => x.includes('aeropuerto')) }
];

const PROTEGIDAS = new Set([...Object.keys(NUMEROS), 'mas', 'tres', 'seis', 'kay', 'lomo', 'mai', 'gas']);

/** Lleva plurales simples al singular: "chaufas especiales" → "chaufa especial". */
function singular(palabra: string): string {
  if (palabra.length <= 3 || PROTEGIDAS.has(palabra)) return palabra;
  if (palabra.endsWith('es') && /[lnrdz]es$/.test(palabra)) return palabra.slice(0, -2);
  if (palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

/** Normaliza, aplica alias y tokeniza conservando las comas como separador. */
export function tokenizarPedido(texto: string): string[] {
  let t = normalizarTexto(texto)
    .replace(/[.;:!?¿¡"()]/g, ' ')
    .replace(/,/g, ' , ')
    .replace(/(\d)\s*l\b/g, '$1 litro')
    .replace(/\s+/g, ' ')
    .trim();
  for (const [re, rep] of ALIAS) t = t.replace(re, rep);
  return t.split(' ').filter(Boolean).map(singular);
}

function cantidadDe(token: string | undefined, siguiente: string | undefined): number | null {
  if (!token) return null;
  if (/^\d+$/.test(token)) return Math.min(parseInt(token, 10), 99);
  if (token === 'media' && siguiente === 'docena') return 0.5;
  return NUMEROS[token] ?? null;
}

/** Busca hacia atrás, dentro del mismo ítem, la cantidad que precede a la posición indicada. */
function cantidadPrevia(tokens: string[], inicio: number, usados: boolean[], terminoEmpiezaConDocena: boolean): number {
  for (let i = inicio - 1; i >= 0; i--) {
    if (usados[i] || SEPARADORES.has(tokens[i])) break;
    const sig = i + 1 === inicio && terminoEmpiezaConDocena ? 'docena' : tokens[i + 1];
    const n = cantidadDe(tokens[i], sig);
    if (n !== null) {
      usados[i] = true;
      return n;
    }
  }
  return 1;
}

/** Conectores opcionales: "sopa de wantan" coincide con "sopa wantan" y viceversa. */
const CONECTORES = new Set(['de', 'del', 'con', 'al', 'la', 'el']);

/** Devuelve el índice final (exclusivo) si la secuencia coincide desde `desde`; si no, -1. */
function coincidir(tokens: string[], seq: string[], desde: number): number {
  let i = desde;
  let k = 0;
  if (tokens[desde] !== seq[0]) return -1;
  while (k < seq.length) {
    if (i < tokens.length && tokens[i] === seq[k]) {
      i++;
      k++;
    } else if (CONECTORES.has(seq[k])) {
      k++;
    } else if (i < tokens.length && CONECTORES.has(tokens[i])) {
      i++;
    } else {
      return -1;
    }
  }
  return i;
}

export function interpretarPedido(texto: string, productos: ReadonlyArray<Producto>): ResultadoInterpretacion {
  const tokens = tokenizarPedido(texto);
  const usados = tokens.map(() => false);

  // 1. Términos de cada producto (nombre sin paréntesis + sinónimos de voz).
  const terminos = productos.map(p => ({
    producto: p,
    seqs: [p.nombre.replace(/\(.*?\)/g, ''), ...(p.sinonimos_voz || [])]
      .map(t => tokenizarPedido(t))
      .filter(s => s.length > 0)
  }));

  // 2. Coincidencias exactas: se priorizan las más largas y no se solapan.
  const candidatos: { inicio: number; fin: number; producto: Producto; seq: string[] }[] = [];
  for (const { producto, seqs } of terminos) {
    for (const seq of seqs) {
      for (let i = 0; i < tokens.length; i++) {
        const fin = coincidir(tokens, seq, i);
        if (fin > i) candidatos.push({ inicio: i, fin, producto, seq });
      }
    }
  }
  candidatos.sort((a, b) => (b.fin - b.inicio) - (a.fin - a.inicio) || a.inicio - b.inicio);

  const elegidos: typeof candidatos = [];
  for (const c of candidatos) {
    let libre = true;
    for (let i = c.inicio; i < c.fin; i++) if (usados[i]) libre = false;
    if (!libre) continue;
    for (let i = c.inicio; i < c.fin; i++) usados[i] = true;
    elegidos.push(c);
  }
  elegidos.sort((a, b) => a.inicio - b.inicio);

  const acumulado = new Map<number, ItemInterpretado>();
  const noDisponibles: Producto[] = [];
  const agregar = (producto: Producto, cantidad: number) => {
    if (!producto.disponible) {
      if (!noDisponibles.includes(producto)) noDisponibles.push(producto);
      return;
    }
    const previo = acumulado.get(producto.id_producto);
    if (previo) previo.cantidad += cantidad;
    else acumulado.set(producto.id_producto, { producto, cantidad });
  };

  for (const c of elegidos) {
    agregar(c.producto, cantidadPrevia(tokens, c.inicio, usados, c.seq[0] === 'docena'));
  }

  // 3. Términos genéricos ("una sopa", "dos gaseosas", "pollo"...).
  const noReconocidos: string[] = [];
  const ambiguos: AmbiguedadPedido[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (usados[i]) continue;
    const generico = GENERICOS.find(g => g.palabra === tokens[i]);
    if (!generico) continue;

    usados[i] = true;
    // "chaufa de pollo", "sopa con fideos": variante con calificador que no existe en la carta.
    const calificador = (tokens[i + 1] === 'de' || tokens[i + 1] === 'con') &&
      tokens[i + 2] && !usados[i + 2] && !SEPARADORES.has(tokens[i + 2]) && cantidadDe(tokens[i + 2], tokens[i + 3]) === null;
    const cantidad = cantidadPrevia(tokens, i, usados, false);
    if (calificador) {
      usados[i + 1] = usados[i + 2] = true;
      noReconocidos.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
      continue;
    }

    const opciones = terminos
      .filter(t => generico.coincide(t.seqs.map(s => s.join(' '))))
      .map(t => t.producto)
      .filter(p => p.disponible);
    if (opciones.length === 1) agregar(opciones[0], cantidad);
    else if (opciones.length > 1) ambiguos.push({ termino: tokens[i], cantidad, opciones });
    else noReconocidos.push(tokens[i]);
  }

  // 4. Fragmentos restantes con una cantidad seguida de algo que no está en la carta ("dos lasañas").
  let fragmento: string[] = [];
  let conCantidad = false;
  const cerrar = () => {
    const palabras = fragmento.filter(t => !RELLENO.has(t) && cantidadDe(t, undefined) === null);
    if (conCantidad && palabras.length > 0) noReconocidos.push(palabras.join(' '));
    fragmento = [];
    conCantidad = false;
  };
  tokens.forEach((t, i) => {
    if (usados[i] || SEPARADORES.has(t)) {
      cerrar();
      return;
    }
    if (cantidadDe(t, tokens[i + 1]) !== null) {
      if (fragmento.length && conCantidad) cerrar();
      conCantidad = true;
    }
    fragmento.push(t);
  });
  cerrar();

  return {
    items: [...acumulado.values()],
    noReconocidos,
    noDisponibles,
    ambiguos
  };
}
