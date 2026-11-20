export interface Categoria {
  id_categoria: number;
  nombre: string;
  slug: string;
  descripcion: string;
  icono: string;
}

export const CATEGORIAS_CHIFA: Categoria[] = [
  { id_categoria: 1, nombre: 'Especialidades', slug: 'especialidades', descripcion: 'Recetas maestras del Wok con técnica ancestral cantonesa y sazón criolla', icono: 'star' },
  { id_categoria: 2, nombre: 'Chaufas', slug: 'chaufas', descripcion: 'Arroz al wok con fuego alto, sillao oriental, cebollita china y carnes selectas', icono: 'rice_bowl' },
  { id_categoria: 3, nombre: 'Saltados', slug: 'saltados', descripcion: 'Cortes jugosos al wok flameados con pisco, cebolla morada, tomate y ají amarillo', icono: 'skillet' },
  { id_categoria: 4, nombre: 'Sopas & Entradas', slug: 'sopas', descripcion: 'Wantanes crujientes, siu mai artesanal y caldos reconfortantes', icono: 'ramen_dining' },
  { id_categoria: 5, nombre: 'Bebidas', slug: 'bebidas', descripcion: 'Refrescos típicos, cervezas y gaseosas para acompañar tu banquete', icono: 'local_bar' }
];
