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

export interface OpcionSugerida {
  producto: Producto;
  /** Similitud 0-1 entre lo escuchado y el plato (1 = idéntico). */
  puntaje: number;
}

/**
 * Fragmento del pedido que Mei no puede resolver con certeza:
 * - 'probable': un plato destaca claramente (coincidencia alta): se propone y se pide confirmar.
 * - 'ambiguo': varias opciones razonables (coincidencia media o palabra genérica como "pollo").
 * - 'no_existe': el plato pedido no está en la carta ("chaufa de pollo"); se ofrecen parecidos.
 */
export interface DudaPedido {
  /** Texto tal como se entendió (p. ej. "pollo tip packay"). */
  texto: string;
  cantidad: number;
  tipo: 'probable' | 'ambiguo' | 'no_existe';
  opciones: OpcionSugerida[];
}

export interface ResultadoInterpretacion {
  items: ItemInterpretado[];
  /** Fragmentos con cantidad sin ninguna coincidencia confiable en la carta. */
  noReconocidos: string[];
  /** Platos de la carta mencionados que hoy están pausados o agotados. */
  noDisponibles: Producto[];
  /** Fragmentos que requieren que el comensal elija o confirme un plato. */
  dudas: DudaPedido[];
}

/**
 * Umbrales de similitud calibrados con la carta real (ver interprete-pedido.util.spec.ts):
 * - UMBRAL_ALTO: por encima de la similitud máxima medida entre términos de platos distintos,
 *   de modo que un plato "probable" no se confunde con otro de la carta.
 * - UMBRAL_MEDIO: los errores de transcripción probados quedan por encima; lo que queda por
 *   debajo no se sugiere y se informa como no reconocido.
 */
export const UMBRAL_ALTO = 0.8;
export const UMBRAL_MEDIO = 0.6;
/** Diferencia mínima con la segunda opción para proponer un único plato. */
export const MARGEN_PROBABLE = 0.12;
/** Máximo de opciones mostradas en el selector. */
export const MAX_OPCIONES = 4;

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
  [/\binka (cola|colas|kolas)\b/g, 'inka kola'],
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
const GENERICOS: ReadonlyArray<{ palabra: string; coincide: (terminos: string[], categoria: string) => boolean }> = [
  { palabra: 'chaufa', coincide: (t, cat) => t.some(x => x.includes('chaufa')) || cat.includes('chaufa') },
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

/**
 * Clave fonética para comparar transcripciones imperfectas con la carta:
 * une las palabras y aplica equivalencias del español hablado y escrito
 * (ch, c/qu/k, z/s, ll/y, h muda, j≈h, v/b, "y" final como "i", letras dobles).
 */
export function claveFonetica(tokens: ReadonlyArray<string>): string {
  return tokens
    .filter(t => !CONECTORES.has(t))
    .map(t => t.replace(/y$/, 'i'))
    .join('')
    .replace(/ch/g, '1')
    .replace(/qu/g, 'k')
    .replace(/c(?=[ei])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/v/g, 'b')
    .replace(/ll/g, 'y')
    .replace(/[hj]/g, '')
    .replace(/(.)\1+/g, '$1');
}

function levenshtein(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

/**
 * Similitud 0-1 entre dos claves fonéticas (Levenshtein normalizado). Si lo escuchado es
 * el comienzo del nombre ("tipa" → "tipakai") se valora como nombre parcialmente pronunciado.
 */
export function similitud(escuchado: string, termino: string): number {
  if (!escuchado || !termino) return 0;
  const base = 1 - levenshtein(escuchado, termino) / Math.max(escuchado.length, termino.length);
  const parcial = escuchado.length >= 4 && termino.startsWith(escuchado)
    ? 0.6 + 0.3 * (escuchado.length / termino.length)
    : 0;
  return Math.round(Math.max(base, parcial) * 1000) / 1000;
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

  const categoriaDe = (p: Producto) => normalizarTexto(p.categoria_nombre);
  for (const c of elegidos) {
    // "pollo tipakay": la palabra genérica pegada a un plato que la contiene es parte del mismo ítem.
    const previo = tokens[c.inicio - 1];
    const generico = GENERICOS.find(g => g.palabra === previo);
    const terminosProducto = (terminos.find(t => t.producto === c.producto)?.seqs || []).map(x => x.join(' '));
    if (generico && !usados[c.inicio - 1] && generico.coincide(terminosProducto, categoriaDe(c.producto))) {
      usados[c.inicio - 1] = true;
      c.inicio -= 1;
    }
    agregar(c.producto, cantidadPrevia(tokens, c.inicio, usados, c.seq[0] === 'docena'));
  }

  const noReconocidos: string[] = [];
  const dudas: DudaPedido[] = [];
  const disponibles = terminos.filter(t => t.producto.disponible);
  const clavesProducto = disponibles.map(t => ({ producto: t.producto, claves: t.seqs.map(claveFonetica) }));

  /** Opciones de la carta ordenadas por similitud con lo escuchado (≥ umbral medio). */
  const rankear = (clave: string): OpcionSugerida[] => clavesProducto
    .map(({ producto, claves }) => ({ producto, puntaje: Math.max(...claves.map(k => similitud(clave, k))) }))
    .filter(o => o.puntaje >= UMBRAL_MEDIO)
    .sort((a, b) => b.puntaje - a.puntaje);

  // 2b. Búsqueda aproximada en los fragmentos sin resolver ("pollo tip packay", "inka colas").
  const esPalabraDePlato = (i: number) => i >= 0 && i < tokens.length && !usados[i] &&
    !SEPARADORES.has(tokens[i]) && !RELLENO.has(tokens[i]) && cantidadDe(tokens[i], tokens[i + 1]) === null;
  const contieneGenerico = (inicio: number, fin: number) =>
    tokens.slice(inicio, fin).some(t => GENERICOS.some(g => g.palabra === t));
  const tramos: { inicio: number; fin: number; ranking: OpcionSugerida[] }[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!esPalabraDePlato(i)) continue;
    for (let fin = i + 1; fin <= Math.min(tokens.length, i + 5); fin++) {
      const t = tokens[fin - 1];
      if (usados[fin - 1] || SEPARADORES.has(t) || cantidadDe(t, tokens[fin]) !== null) break;
      if (!esPalabraDePlato(fin - 1)) continue; // un tramo no termina en relleno ni conector
      if (fin - i === 1 && GENERICOS.some(g => g.palabra === tokens[i])) continue; // "pollo" solo: selector por familia
      const clave = claveFonetica(tokens.slice(i, fin));
      if (clave.length < 4) continue; // claves muy cortas generan falsos positivos
      const ranking = rankear(clave);
      // Con una palabra genérica ("chaufa de pollo") solo se acepta una coincidencia alta;
      // si no, decide el paso de genéricos (familia de platos o "no existe en la carta").
      if (ranking.length > 0 && (ranking[0].puntaje >= UMBRAL_ALTO || !contieneGenerico(i, fin))) {
        tramos.push({ inicio: i, fin, ranking });
      }
    }
  }
  tramos.sort((a, b) => b.ranking[0].puntaje - a.ranking[0].puntaje || (b.fin - b.inicio) - (a.fin - a.inicio));
  for (const tramo of tramos) {
    let libre = true;
    for (let i = tramo.inicio; i < tramo.fin; i++) if (usados[i]) libre = false;
    if (!libre) continue;
    for (let i = tramo.inicio; i < tramo.fin; i++) usados[i] = true;
    const [mejor, segunda] = tramo.ranking;
    const probable = mejor.puntaje >= UMBRAL_ALTO && (!segunda || mejor.puntaje - segunda.puntaje >= MARGEN_PROBABLE);
    dudas.push({
      texto: tokens.slice(tramo.inicio, tramo.fin).join(' '),
      cantidad: cantidadPrevia(tokens, tramo.inicio, usados, false),
      tipo: probable ? 'probable' : 'ambiguo',
      opciones: tramo.ranking.slice(0, MAX_OPCIONES)
    });
  }

  // 3. Términos genéricos ("una sopa", "dos gaseosas", "pollo"...).

  for (let i = 0; i < tokens.length; i++) {
    if (usados[i]) continue;
    const generico = GENERICOS.find(g => g.palabra === tokens[i]);
    if (!generico) continue;

    usados[i] = true;
    // Palabras de plato pegadas a la genérica ("chaufa de pollo", "lomo saltado"): variante que no
    // existe en la carta. Nunca se autocompleta: se informa y se ofrecen los platos de esa familia.
    let inicio = i;
    let fin = i + 1;
    if (i > 0 && esPalabraDePlato(i - 1)) inicio = i - 1;
    if ((tokens[i + 1] === 'de' || tokens[i + 1] === 'con') && esPalabraDePlato(i + 2)) fin = i + 3;
    else if (esPalabraDePlato(i + 1)) fin = i + 2;
    for (let k = inicio; k < fin; k++) usados[k] = true;
    const cantidad = cantidadPrevia(tokens, inicio, usados, false);
    const opciones = disponibles
      .filter(t => generico.coincide(t.seqs.map(x => x.join(' ')), categoriaDe(t.producto)))
      .map(t => ({ producto: t.producto, puntaje: 1 }));
    if (fin - inicio > 1) {
      dudas.push({ texto: tokens.slice(inicio, fin).join(' '), cantidad, tipo: 'no_existe', opciones: opciones.slice(0, MAX_OPCIONES) });
      continue;
    }

    if (opciones.length === 1) agregar(opciones[0].producto, cantidad);
    else if (opciones.length > 1) dudas.push({ texto: tokens[i], cantidad, tipo: 'ambiguo', opciones: opciones.slice(0, MAX_OPCIONES) });
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
    dudas
  };
}
