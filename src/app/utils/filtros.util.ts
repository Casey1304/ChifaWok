import { Producto } from '../models/producto.model';
import { coincideBusqueda } from './texto.util';

/**
 * Filtra productos por categoría y término de búsqueda (combinables).
 * No modifica la lista original: devuelve un nuevo arreglo.
 */
export function filtrarProductos(
  productos: ReadonlyArray<Producto>,
  categoriaId: number | null,
  termino: string
): Producto[] {
  return productos.filter(p =>
    (categoriaId === null || p.id_categoria === categoriaId) &&
    coincideBusqueda(termino, [p.nombre, p.descripcion, p.categoria_nombre, ...(p.sinonimos_voz || [])])
  );
}
