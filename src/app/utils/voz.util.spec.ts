import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirVoz, generoDeVoz, ordenarVoces, textoParaVoz, VozInfo } from './voz.util';

// Voces reales informadas por Chrome/Edge en Windows (nombre y lang).
const v = (name: string, lang: string): VozInfo => ({ name, lang, voiceURI: name });
const WINDOWS_CHROME = [
  v('Microsoft Raul - Spanish (Mexico)', 'es-MX'),
  v('Microsoft Sabina - Spanish (Mexico)', 'es-MX'),
  v('Microsoft Pablo - Spanish (Spain)', 'es-ES'),
  v('Microsoft Helena - Spanish (Spain)', 'es-ES'),
  v('Google español', 'es-ES'),
  v('Google español de Estados Unidos', 'es-US'),
  v('Microsoft Zira - English (United States)', 'en-US')
];
const EDGE_NATURAL = [
  ...WINDOWS_CHROME,
  v('Microsoft Alex Online (Natural) - Spanish (Peru)', 'es-PE'),
  v('Microsoft Camila Online (Natural) - Spanish (Peru)', 'es-PE'),
  v('Microsoft Dalia Online (Natural) - Spanish (Mexico)', 'es-MX'),
  v('Microsoft Jorge Online (Natural) - Spanish (Mexico)', 'es-MX')
];

test('género estimado por el nombre de la voz', () => {
  assert.equal(generoDeVoz(v('Microsoft Sabina - Spanish (Mexico)', 'es-MX')), 'femenina');
  assert.equal(generoDeVoz(v('Microsoft Raul - Spanish (Mexico)', 'es-MX')), 'masculina');
  assert.equal(generoDeVoz(v('Microsoft Camila Online (Natural) - Spanish (Peru)', 'es-PE')), 'femenina');
  assert.equal(generoDeVoz(v('Google español', 'es-ES')), 'femenina');
});

test('Chrome en Windows: elige Sabina (femenina, México) y no Raul aunque aparezca primero', () => {
  assert.equal(elegirVoz(WINDOWS_CHROME)?.name, 'Microsoft Sabina - Spanish (Mexico)');
});

test('Edge con voces naturales: elige Camila (femenina, Perú, natural)', () => {
  assert.equal(elegirVoz(EDGE_NATURAL)?.name, 'Microsoft Camila Online (Natural) - Spanish (Peru)');
});

test('las voces masculinas quedan detrás de cualquier voz femenina en español', () => {
  const orden = ordenarVoces(EDGE_NATURAL).map(x => generoDeVoz(x));
  const primeraMasculina = orden.indexOf('masculina');
  assert.ok(orden.slice(primeraMasculina).every(g => g !== 'femenina'));
});

test('sin voz femenina usa la mejor en español; sin español devuelve null', () => {
  assert.equal(elegirVoz([v('Microsoft Raul - Spanish (Mexico)', 'es-MX'), v('Microsoft Zira - English', 'en-US')])?.lang, 'es-MX');
  assert.equal(elegirVoz([v('Microsoft Zira - English', 'en-US')]), null);
});

test('recupera la voz preferida guardada si sigue disponible; si no, vuelve a la automática', () => {
  assert.equal(elegirVoz(WINDOWS_CHROME, 'Google español')?.name, 'Google español');
  assert.equal(elegirVoz(WINDOWS_CHROME, 'Voz que ya no existe')?.name, 'Microsoft Sabina - Spanish (Mexico)');
});

test('pronunciación de los platos de la carta', () => {
  assert.equal(textoParaVoz('Pollo Tipa Kay'), 'Pollo Tipa Cai');
  assert.equal(textoParaVoz('tipakay'), 'Tipa Cai');
  assert.equal(textoParaVoz('Pollo Chi Jau Kay'), 'Pollo Chi Yau Cai');
  assert.equal(textoParaVoz('Kam Lu Wantán Especial'), 'Cam Lu guantán Especial');
  assert.equal(textoParaVoz('3 Inka Kola 1L (Helada)'), '3 Inca Cola 1 litro (Helada)');
  assert.equal(textoParaVoz('dos Inka Kolas'), 'dos Inca Colas');
  assert.equal(textoParaVoz('Wantán Frito Clásico (12 unidades) y wantanes'), 'guantán Frito Clásico (12 unidades) y guantanes');
});

test('no modifica palabras que ya se pronuncian bien ni partes de otras palabras', () => {
  const sinCambios = 'Arroz Chaufa Especial y Tallarín Saltado de Lomo con Chicha Morada';
  assert.equal(textoParaVoz(sinCambios), sinCambios);
  assert.equal(textoParaVoz('kayak, Kaiser, Kolaboración'), 'kayak, Kaiser, Kolaboración');
});

test('el nombre del asistente "Mei" se pronuncia en una sílaba, sin tocar otras palabras', () => {
  assert.equal(textoParaVoz('¡Hola! Soy Mei, tu asistente.'), '¡Hola! Soy Mey, tu asistente.');
  assert.equal(textoParaVoz('Pídele a MEI'), 'Pídele a Mey');
  assert.equal(textoParaVoz('Meiji, Meister y remeis'), 'Meiji, Meister y remeis');
});

test('montos, códigos y litros se leen de forma natural', () => {
  assert.equal(textoParaVoz('Tu pedido suma S/ 86.00.'), 'Tu pedido suma 86 soles.');
  assert.equal(textoParaVoz('Total: S/ 62.50'), 'Total: 62 soles con 50 céntimos');
  assert.equal(textoParaVoz('S/ 1.00'), '1 sol');
  assert.equal(textoParaVoz('Registré tu pedido #1045'), 'Registré tu pedido número 1045');
});
