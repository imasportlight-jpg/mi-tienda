'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { loadProductos, Producto } from '../lib/productsStore';

export default function ProductsPage() {
  const [store] = useState(() => {
    const loaded = loadProductos();
    const prices = loaded.map((p) => p.precioDescuento).filter((n) => Number.isFinite(n));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { productos: loaded, globalMin: min, globalMax: max };
  });

  const productos: Producto[] = store.productos;
  const globalMin = store.globalMin;
  const globalMax = store.globalMax;
  const [busqueda, setBusqueda] = useState('');

  const [minPrecio, setMinPrecio] = useState(globalMin);
  const [maxPrecio, setMaxPrecio] = useState(globalMax);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return productos.filter((p) => {
      const cumplePrecio = p.precioDescuento >= minPrecio && p.precioDescuento <= maxPrecio;
      const cumpleTexto = q ? p.titulo.toLowerCase().includes(q) : true;
      return cumplePrecio && cumpleTexto;
    });
  }, [productos, busqueda, minPrecio, maxPrecio]);

  const resetFiltros = () => {
    setMinPrecio(globalMin);
    setMaxPrecio(globalMax);
    setBusqueda('');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <header className="bg-white border-b py-4 px-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tighter cursor-pointer">
          IMA<span className="text-sm font-normal text-gray-500 ml-1">sports lighting</span>
        </Link>
        <span className="text-sm text-gray-500 font-medium">Productos</span>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar filtros */}
        <aside className="md:sticky md:top-6 self-start">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Filtrar</h2>

            <div className="flex flex-col gap-3 mb-6">
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black transition"
              />
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Min</span>
                <span className="font-bold text-gray-900">
                  ${minPrecio.toLocaleString('es-AR')}
                </span>
              </div>

              <input
                type="range"
                min={globalMin}
                max={globalMax}
                step={1000}
                value={minPrecio}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMinPrecio(Math.min(next, maxPrecio));
                }}
                className="w-full"
              />

              <div className="flex justify-between text-sm text-gray-600">
                <span>Max</span>
                <span className="font-bold text-gray-900">
                  ${maxPrecio.toLocaleString('es-AR')}
                </span>
              </div>

              <input
                type="range"
                min={globalMin}
                max={globalMax}
                step={1000}
                value={maxPrecio}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMaxPrecio(Math.max(next, minPrecio));
                }}
                className="w-full"
              />
            </div>

            <button
              onClick={resetFiltros}
              className="w-full bg-gray-100 hover:bg-gray-200 transition text-sm font-bold py-2 rounded-lg"
            >
              Resetear
            </button>
          </div>
        </aside>

        {/* Contenido listado */}
        <section>
          <div className="mb-6">
            <h1 className="text-3xl font-semibold">Productos</h1>
            <p className="text-gray-600 text-sm mt-1">
              Mostrando {productosFiltrados.length} producto(s) entre{' '}
              <span className="font-bold">${minPrecio.toLocaleString('es-AR')}</span> y{' '}
              <span className="font-bold">${maxPrecio.toLocaleString('es-AR')}</span>
            </p>
          </div>

          {productosFiltrados.length === 0 ? (
            <p className="text-center text-gray-500 mt-20">No hay productos para este rango.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  className="group flex flex-col relative border border-transparent hover:border-gray-200 p-4 rounded-xl transition-all"
                >
                  <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                    {producto.descuento && (
                      <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">
                        {producto.descuento}
                      </span>
                    )}
                    {producto.envioGratis && (
                      <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 uppercase">
                        Envío gratis
                      </span>
                    )}
                  </div>

                  <div className="aspect-square bg-gray-100 mb-4 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {producto.image1 ? (
                      <div className="absolute inset-0">
                        {producto.image2 ? (
                          <>
                            <img
                              src={producto.image1}
                              alt={producto.titulo}
                              className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-0 transition-opacity"
                            />
                            <img
                              src={producto.image2}
                              alt={producto.titulo}
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </>
                        ) : (
                          <img
                            src={producto.image1}
                            alt={producto.titulo}
                            className="absolute inset-0 w-full h-full object-cover opacity-100"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="relative z-10 text-gray-400 text-sm">Sin imagen</span>
                    )}
                  </div>

                  <h3 className="text-sm font-medium text-gray-800 leading-tight mb-2 line-clamp-2">
                    {producto.titulo}
                  </h3>

                  <div className="mt-auto">
                    {producto.precioOriginal && (
                      <p className="text-xs text-gray-500 line-through mb-0.5">
                        ${producto.precioOriginal.toLocaleString('es-AR')}
                      </p>
                    )}
                    <p className="text-lg font-bold">${producto.precioDescuento.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

