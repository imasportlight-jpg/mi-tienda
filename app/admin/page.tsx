'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/canvasUtils';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [autenticado, setAutenticado] = useState(false);

  const [modalConfirm, setModalConfirm] = useState<{
    abierto: boolean;
    titulo: string;
    mensaje: string;
    onConfirm: () => void;
  }>({ abierto: false, titulo: '', mensaje: '', onConfirm: () => {} });

  const [imagenParaRecortar, setImagenParaRecortar] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaRecortada, setAreaRecortada] = useState<any>(null);
  const [datosSubidaPendiente, setDatosSubidaPendiente] = useState<any>(null);

  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [precioOriginal, setPrecioOriginal] = useState('');
  const [precioDescuento, setPrecioDescuento] = useState('');
  const [stock, setStock] = useState('0');
  const [descripcion, setDescripcion] = useState('');
  
  const [categoriasBase, setCategoriasBase] = useState(['Iluminación', 'Herramientas', 'Infladores', 'Seguridad', 'Accesorios']);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Iluminación');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [mostrarInputNueva, setMostrarInputNueva] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email !== "imasportlight@gmail.com") {
        window.location.href = "/";
      } else {
        setAutenticado(true);
        fetchProductos();
      }
    };
    checkUser();
  }, []);

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) {
      setProductos(data);
      const catsEnBD = data.map(p => p.categoria).filter(Boolean);
      const unicas = Array.from(new Set([...categoriasBase, ...catsEnBD]));
      setCategoriasBase(unicas);
    }
  };

  const alSeleccionarArchivo = (id: number, e: any, columna: string) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImagenParaRecortar(reader.result as string);
      setDatosSubidaPendiente({ id, columna });
    };
  };

  const onCropComplete = useCallback((_area: any, areaPixels: any) => {
    setAreaRecortada(areaPixels);
  }, []);

  const subirFotoRecortada = async () => {
    if (!imagenParaRecortar || !areaRecortada) return;
    const tId = toast.loading('Subiendo imagen...');
    setCargando(true);
    try {
      const blob = await getCroppedImg(imagenParaRecortar, areaRecortada);
      const fileName = `${datosSubidaPendiente.id}/${datosSubidaPendiente.columna}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('FOTOS-PRODUCTOS').upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('FOTOS-PRODUCTOS').getPublicUrl(fileName);
      await supabase.from('productos').update({ [datosSubidaPendiente.columna]: publicUrl }).eq('id', datosSubidaPendiente.id);

      fetchProductos();
      setImagenParaRecortar(null);
      toast.success('¡Foto actualizada! 📸', { id: tId });
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: tId });
    } finally {
      setCargando(false);
    }
  };

  const eliminarImagen = (id: number, columna: string) => {
    setModalConfirm({
      abierto: true,
      titulo: '¿Eliminar imagen?',
      mensaje: 'Esta acción quitará la foto del producto permanentemente.',
      onConfirm: async () => {
        const tId = toast.loading('Borrando...');
        const { error } = await supabase.from('productos').update({ [columna]: null }).eq('id', id);
        if (error) toast.error(error.message, { id: tId });
        else {
          toast.success('Imagen eliminada 🗑️', { id: tId });
          fetchProductos();
        }
        setModalConfirm(prev => ({ ...prev, abierto: false }));
      }
    });
  };

  const guardarProducto = async () => {
    if (!titulo || !precioDescuento) return toast.error("Nombre y precio obligatorios");
    const tId = toast.loading('Guardando...');
    setCargando(true);
    const catFinal = mostrarInputNueva ? nuevaCategoria : categoriaSeleccionada;
    const datos = {
      titulo,
      precio_original: precioOriginal ? Number(precioOriginal) : null,
      precio_descuento: Number(precioDescuento),
      categoria: catFinal,
      stock: Number(stock),
      descripcion,
    };

    try {
      if (idEditando) {
        const { error } = await supabase.from('productos').update(datos).eq('id', idEditando);
        if (error) throw error;
        toast.success("¡Actualizado! 🔄", { id: tId });
      } else {
        const { error } = await supabase.from('productos').insert([{ ...datos, imagen_url: '' }]);
        if (error) throw error;
        toast.success("¡Creado! Subí las fotos abajo. 🚀", { id: tId });
      }
      limpiarFormulario();
      fetchProductos();
    } catch (error: any) {
      toast.error(error.message, { id: tId });
    } finally {
      setCargando(false);
    }
  };

  const prepararEdicion = (p: any) => {
    setIdEditando(p.id);
    setTitulo(p.titulo);
    setPrecioOriginal(p.precio_original || '');
    setPrecioDescuento(p.precio_descuento);
    setCategoriaSeleccionada(p.categoria);
    setStock(p.stock.toString());
    setDescripcion(p.descripcion || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Editando producto', { icon: '📝' });
  };

  const limpiarFormulario = () => {
    setIdEditando(null); setTitulo(''); setPrecioOriginal(''); setPrecioDescuento(''); setStock('0'); setDescripcion(''); setNuevaCategoria(''); setMostrarInputNueva(false);
  };

  const eliminarProducto = (id: number) => {
    setModalConfirm({
      abierto: true,
      titulo: '¿Eliminar producto?',
      mensaje: 'Esta acción no se puede deshacer. El producto desaparecerá de la tienda.',
      onConfirm: async () => {
        const tId = toast.loading('Eliminando...');
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) toast.error(error.message, { id: tId });
        else {
          toast.success('Eliminado 🗑️', { id: tId });
          fetchProductos();
        }
        setModalConfirm(prev => ({ ...prev, abierto: false }));
      }
    });
  };

  const actualizarStock = async (id: number, nuevoStock: string) => {
    await supabase.from('productos').update({ stock: Number(nuevoStock) }).eq('id', id);
  };

  if (!autenticado) return <div className="p-20 text-center font-black uppercase text-black">Verificando acceso...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <Toaster position="top-right" reverseOrder={false} />

      {modalConfirm.abierto && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-black mb-2">{modalConfirm.titulo}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">{modalConfirm.mensaje}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setModalConfirm(prev => ({ ...prev, abierto: false }))}
                className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-gray-100 hover:bg-gray-50 transition-colors text-black"
              >
                Cancelar
              </button>
              <button 
                onClick={modalConfirm.onConfirm}
                className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-black text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {imagenParaRecortar && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-xl aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl text-black">
            <Cropper image={imagenParaRecortar} crop={crop} zoom={zoom} aspect={1 / 1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div className="mt-8 w-full max-w-md space-y-6">
            <div className="flex items-center gap-4 text-white">
              <span className="text-[10px] font-black uppercase text-white">Zoom</span>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-red-600" />
            </div>
            <div className="flex gap-4">
               <button onClick={() => setImagenParaRecortar(null)} className="flex-1 bg-white/10 text-white py-4 rounded-xl font-black uppercase text-xs">Cancelar</button>
               <button onClick={subirFotoRecortada} disabled={cargando} className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg">
                 {cargando ? 'SUBIENDO...' : 'APLICAR Y SUBIR'}
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-center border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">IMA ADMIN</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Gestión de Stock</p>
            </div>
            <button 
              onClick={() => window.location.href = "/admin/ventas"} 
              className="bg-[#002d5a] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"
            >
              Ventas 💰
            </button>
          </div>
          <button onClick={() => window.location.href = "/"} className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#002d5a] transition-all shadow-lg">← Tienda</button>
        </header>
        
        {/* SECCIÓN FORMULARIO CON BORDES NEGROS FIJOS */}
        <section className="bg-white p-6 rounded-3xl shadow-xl border border-[#002d5a]/20 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black uppercase text-black">{idEditando ? `Editando: ${titulo}` : 'Nuevo Producto'}</h2>
            {idEditando && <button onClick={limpiarFormulario} className="text-[10px] font-black uppercase text-gray-400 underline">Cancelar</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Nombre</label>
              <input value={titulo} className="w-full border-2 border-black bg-white p-3 rounded-xl outline-none font-bold text-black" onChange={e => setTitulo(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Categoría</label>
              {!mostrarInputNueva ? (
                <select className="w-full border-2 border-black bg-white p-3 rounded-xl outline-none font-bold text-black" value={categoriaSeleccionada} onChange={e => e.target.value === "NUEVA" ? setMostrarInputNueva(true) : setCategoriaSeleccionada(e.target.value)}>
                  {categoriasBase.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="NUEVA" className="text-red-600 font-bold">+ AGREGAR NUEVA</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input autoFocus className="flex-1 border-2 border-black bg-white p-3 rounded-xl outline-none font-bold text-black" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} />
                  <button onClick={() => setMostrarInputNueva(false)} className="text-black font-bold hover:text-red-600 transition-colors">X</button>
                </div>
              )}
            </div>
            <input type="number" value={precioOriginal} className="w-full border-2 border-black bg-white p-3 rounded-xl outline-none text-black font-bold" onChange={e => setPrecioOriginal(e.target.value)} placeholder="Precio Original" />
            <input type="number" value={precioDescuento} className="w-full border-2 border-black bg-white p-3 rounded-xl outline-none font-black text-black" onChange={e => setPrecioDescuento(e.target.value)} placeholder="Precio Venta" />
            <input type="number" value={stock} className="w-full border-2 border-black bg-white p-3 rounded-xl outline-none font-bold text-black" onChange={e => setStock(e.target.value)} />
            <textarea value={descripcion} className="md:col-span-3 w-full border-2 border-black bg-white p-3 rounded-xl outline-none h-24 text-black font-medium" onChange={e => setDescripcion(e.target.value)} placeholder="Descripción..." />
            <button onClick={guardarProducto} disabled={cargando} className={`md:col-span-3 p-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl transition-all ${idEditando ? 'bg-[#002d5a] hover:bg-black text-white' : 'bg-black hover:bg-[#002d5a] text-white'}`}>
              {idEditando ? 'GUARDAR CAMBIOS 💾' : 'CREAR PRODUCTO 🚀'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#002d5a]/20 text-black">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-white text-[9px] uppercase tracking-[0.2em]">
                <th className="p-6 font-black">Producto</th>
                <th className="p-6 font-black text-center">Fotos (6 slots)</th>
                <th className="p-6 font-black text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-6">
                    <div className="font-black uppercase italic text-sm text-black">{p.titulo}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[8px] bg-gray-100 px-2 py-1 rounded font-black text-gray-500 uppercase">{p.categoria}</span>
                      <div className="bg-gray-50 px-2 py-1 rounded flex items-center border border-[#002d5a]/10">
                        <span className="text-[8px] font-black text-black px-1">STOCK:</span>
                        <input type="number" className="bg-transparent w-8 text-[9px] font-black text-black outline-none" defaultValue={p.stock} onBlur={(e) => actualizarStock(p.id, e.target.value)} />
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-1.5 flex-wrap max-w-[160px] mx-auto">
                      {['imagen_url', 'imagen_url_2', 'imagen_url_3', 'imagen_url_4', 'imagen_url_5', 'imagen_url_6'].map((col, i) => (
                        <div key={col} className="relative group">
                          <label className="cursor-pointer block">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-100 group-hover:border-[#002d5a] transition-all shadow-sm bg-gray-50">
                               <img src={p[col] || 'https://via.placeholder.com/100?text=+'} className={`w-full h-full object-cover ${!p[col] && 'opacity-10'}`} alt="" />
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={e => alSeleccionarArchivo(p.id, e, col)} />
                          </label>
                          {p[col] && (
                            <button 
                              onClick={() => eliminarImagen(p.id, col)}
                              className="absolute -top-1.5 -right-1.5 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-lg hover:scale-110 transition-transform z-10"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-6 text-right space-x-4">
                    <button onClick={() => prepararEdicion(p)} className="text-[#002d5a] font-black text-[9px] uppercase hover:underline">Editar</button>
                    <button onClick={() => eliminarProducto(p.id)} className="text-red-600 font-black text-[9px] uppercase hover:underline">Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}