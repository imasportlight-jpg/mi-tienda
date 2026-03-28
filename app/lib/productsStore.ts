export type Producto = {
  id: number;
  titulo: string;
  precioDescuento: number;
  precioOriginal: number | null;
  descuento: string | null;
  envioGratis: boolean;
  image1: string | null;
  image2: string | null;
};

const STORAGE_KEY = 'mi-tienda:productos';

// Seed inicial (si el usuario no tiene productos guardados todavía).
const productosSeed: Producto[] = [
  {
    id: 1,
    titulo: 'Bomba de Bicicleta Eléctrica A2 Mini 100ps',
    precioOriginal: 180000,
    precioDescuento: 168000,
    descuento: '7% OFF',
    envioGratis: true,
    image1: null,
    image2: null,
  },
  {
    id: 2,
    titulo: 'Luz Trasera Inteligente Bicicleta CY110',
    precioOriginal: null,
    precioDescuento: 34000,
    descuento: null,
    envioGratis: true,
    image1: null,
    image2: null,
  },
  {
    id: 3,
    titulo: 'Soporte Ciclocomputadora y Luz S2',
    precioOriginal: null,
    precioDescuento: 23000,
    descuento: null,
    envioGratis: true,
    image1: null,
    image2: null,
  },
  {
    id: 4,
    titulo: 'Linterna Edc Recargable Mini X3-se',
    precioOriginal: null,
    precioDescuento: 90000,
    descuento: null,
    envioGratis: true,
    image1: null,
    image2: null,
  },
];

function cloneProductos(input: Producto[]): Producto[] {
  return input.map((p) => ({ ...p }));
}

function ensureSeedInStorage() {
  if (typeof window === 'undefined') return;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cloneProductos(productosSeed)));
}

export function loadProductos(): Producto[] {
  if (typeof window === 'undefined') return cloneProductos(productosSeed);

  ensureSeedInStorage();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneProductos(productosSeed);

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return cloneProductos(productosSeed);

    // Sanitizamos un poco para evitar romper la UI.
    const sanitized: Producto[] = parsed
      .map((p) => {
        if (typeof p !== 'object' || p === null) return null;
        const record = p as Record<string, unknown>;

        const id = Number(record.id);
        const titulo = String(record.titulo ?? '');
        const precioDescuento = Number(record.precioDescuento ?? 0);

        const precioOriginal =
          record.precioOriginal === null || record.precioOriginal === undefined
            ? null
            : Number(record.precioOriginal);

        const descuento =
          record.descuento === undefined ? null : (record.descuento ? String(record.descuento) : null);

        const envioGratis = Boolean(record.envioGratis);

        const image1 =
          record.image1 === undefined ? null : (record.image1 ? String(record.image1) : null);
        const image2 =
          record.image2 === undefined ? null : (record.image2 ? String(record.image2) : null);

        if (!Number.isFinite(id) || titulo.trim().length === 0) return null;

        return {
          id,
          titulo,
          precioDescuento,
          precioOriginal: precioOriginal === null ? null : (Number.isFinite(precioOriginal) ? precioOriginal : null),
          descuento,
          envioGratis,
          image1,
          image2,
        };
      })
      .filter((p): p is Producto => Boolean(p));

    return sanitized.length ? sanitized : cloneProductos(productosSeed);
  } catch {
    return cloneProductos(productosSeed);
  }
}

export function saveProductos(productos: Producto[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
}

export function nextProductId(productos: Producto[]) {
  const maxId = productos.reduce((max, p) => Math.max(max, p.id), 0);
  return maxId + 1;
}

