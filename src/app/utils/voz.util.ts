/**
 * Utilidades de síntesis de voz para Mei (solo afectan a lo que se ESCUCHA).
 *
 * - Elección de voz: prioriza voces femeninas en español latinoamericano (Perú, México),
 *   luego cualquier voz femenina en español y, si no hay, la mejor voz en español.
 * - textoParaVoz(): adapta la escritura de nombres chino-peruanos, moneda y códigos para
 *   que el sintetizador los pronuncie bien. Nunca se usa en la interfaz ni en los datos.
 */

/** Datos mínimos de una voz (compatible con SpeechSynthesisVoice). */
export interface VozInfo {
  name: string;
  lang: string;
  voiceURI?: string;
  localService?: boolean;
}

export type GeneroVoz = 'femenina' | 'masculina' | 'desconocido';

const NOMBRES_FEMENINOS = [
  'sabina', 'dalia', 'camila', 'paloma', 'elvira', 'helena', 'laura', 'lucia', 'monica', 'paulina',
  'elena', 'valentina', 'salome', 'renata', 'marina', 'beatriz', 'candela', 'carlota', 'estrella',
  'irene', 'ximena', 'abril', 'catalina', 'triana', 'vera', 'teresa', 'esperanza', 'larissa',
  'andrea', 'karla', 'maria', 'sofia', 'isabela', 'luciana', 'renata', 'yolanda', 'marisol',
  'belkys', 'elsa', 'nuria', 'tania', 'margarita', 'angelica', 'female', 'mujer'
];

const NOMBRES_MASCULINOS = [
  'raul', 'pablo', 'jorge', 'alex', 'alvaro', 'gerardo', 'tomas', 'diego', 'emilio', 'andres',
  'juan', 'carlos', 'enrique', 'mateo', 'federico', 'gonzalo', 'luciano', 'pedro', 'arnau', 'dario',
  'elias', 'saul', 'teo', 'liberto', 'cecilio', 'mario', 'rodrigo', 'yago', 'alonso', 'sergio',
  'lorenzo', 'marcelo', 'roberto', 'jose', 'javier', 'victor', 'francisco', 'male', 'hombre'
];

const LATAM = ['es-pe', 'es-mx', 'es-419', 'es-us', 'es-co', 'es-ar', 'es-cl', 'es-ve', 'es-ec', 'es-bo',
  'es-uy', 'es-py', 'es-cr', 'es-gt', 'es-hn', 'es-ni', 'es-pa', 'es-sv', 'es-do', 'es-pr', 'es-cu'];

function palabras(texto: string): string[] {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Género estimado a partir del nombre de la voz (las APIs del navegador no lo informan). */
export function generoDeVoz(voz: VozInfo): GeneroVoz {
  const p = palabras(voz.name);
  if (p.some(x => NOMBRES_FEMENINOS.includes(x))) return 'femenina';
  if (p.some(x => NOMBRES_MASCULINOS.includes(x))) return 'masculina';
  // Las voces "Google español..." de Chrome son femeninas.
  if (p[0] === 'google') return 'femenina';
  return 'desconocido';
}

/** Puntaje de idoneidad para Mei; null si la voz no es en español. */
export function puntuarVoz(voz: VozInfo): number | null {
  const lang = voz.lang.replace('_', '-').toLowerCase();
  if (!lang.startsWith('es')) return null;
  let puntaje = lang === 'es-pe' ? 40 : lang === 'es-mx' ? 36 : LATAM.includes(lang) ? 32 : lang === 'es-es' ? 20 : 15;
  const genero = generoDeVoz(voz);
  if (genero === 'femenina') puntaje += 100;
  if (genero === 'masculina') puntaje -= 100;
  // Las voces "Natural"/"Online" (Edge) suenan notablemente más naturales.
  if (/natural|online|neural/i.test(voz.name)) puntaje += 20;
  return puntaje;
}

/** Voces en español ordenadas de mejor a peor para Mei. */
export function ordenarVoces<T extends VozInfo>(voces: ReadonlyArray<T>): T[] {
  return voces
    .map(v => ({ v, p: puntuarVoz(v) }))
    .filter((x): x is { v: T; p: number } => x.p !== null)
    .sort((a, b) => b.p - a.p)
    .map(x => x.v);
}

/**
 * Elige la voz de Mei: la preferida guardada si sigue disponible; si no, la mejor automática.
 * Devuelve null si el navegador no tiene ninguna voz en español.
 */
export function elegirVoz<T extends VozInfo>(voces: ReadonlyArray<T>, preferidaURI?: string | null): T | null {
  const ordenadas = ordenarVoces(voces);
  if (preferidaURI) {
    const preferida = ordenadas.find(v => (v.voiceURI || v.name) === preferidaURI);
    if (preferida) return preferida;
  }
  return ordenadas[0] ?? null;
}

/** Adaptaciones fonéticas: solo palabras completas (no dentro de otras palabras). */
const PRONUNCIACION: ReadonlyArray<[RegExp, string]> = [
  [/(?<!\p{L})chi[\s-]?jau[\s-]?ka[iy](?!\p{L})/giu, 'Chi Yau Cai'],
  [/(?<!\p{L})tipa[\s-]?ka[iy](?!\p{L})/giu, 'Tipa Cai'],
  [/(?<!\p{L})kam[\s-]?lu(?!\p{L})/giu, 'Cam Lu'],
  [/(?<!\p{L})inka[\s-]+kola(s?)(?!\p{L})/giu, 'Inca Cola$1'],
  [/(?<!\p{L})inka(?!\p{L})/giu, 'Inca'],
  [/(?<!\p{L})kola(s?)(?!\p{L})/giu, 'cola$1'],
  [/(?<!\p{L})want[aá]nes(?!\p{L})/giu, 'guantanes'],
  [/(?<!\p{L})want[aá]n(?!\p{L})/giu, 'guantán'],
  [/(?<!\p{L})ka[iy](?!\p{L})/giu, 'cai'],
  // Nombre del asistente: la voz leía "Mei" como "Ma"; "Mey" se pronuncia /méi/ en una sílaba (como "rey").
  [/(?<!\p{L})mei(?!\p{L})/giu, 'Mey']
];

/**
 * Texto que pronuncia Mei. Adapta nombres de platos, montos ("S/ 86.00" → "86 soles"),
 * códigos ("#1045" → "número 1045") y litros ("1L" → "1 litro").
 */
export function textoParaVoz(texto: string): string {
  let t = texto
    .replace(/S\/\s?(\d+)(?:[.,](\d{1,2}))?/g, (_, enteros: string, decimales?: string) => {
      const centimos = decimales ? parseInt(decimales.padEnd(2, '0'), 10) : 0;
      const soles = `${parseInt(enteros, 10)} ${enteros === '1' ? 'sol' : 'soles'}`;
      return centimos > 0 ? `${soles} con ${centimos} céntimos` : soles;
    })
    .replace(/(\d+)[.,]00 soles/g, '$1 soles')
    .replace(/#(\d+)/g, 'número $1')
    .replace(/(\d+)\s?L(?!\p{L})/gu, '$1 litro');
  for (const [re, reemplazo] of PRONUNCIACION) t = t.replace(re, reemplazo);
  return t;
}
