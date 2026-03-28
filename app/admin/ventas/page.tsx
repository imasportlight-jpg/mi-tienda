'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import Link from 'next/link';

export default function VentasPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADO PARA EL MODAL PERSONALIZADO ---
  const [modalConfirm, setModalConfirm] = useState<{
    abierto: boolean;
    idPedido: string | null;
  }>({ abierto: false, idPedido: null });

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('creado_en', { ascending: false });

    if (data) setPedidos(data);
    if (error) console.error(error);
    setCargando(false);
  };

  const confirmarEliminacion = async () => {
    if (!modalConfirm.idPedido) return;

    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', modalConfirm.idPedido);

    if (error) {
      alert("Error al eliminar el pedido");
    } else {
      setPedidos(pedidos.filter(p => p.id !== modalConfirm.idPedido));
    }
    setModalConfirm({ abierto: false, idPedido: null });
  };

  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto);
    alert("Copiado: " + texto);
  };

  const totalVendido = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
  const pedidosPendientes = pedidos.filter(p => p.estado_pago === 'pendiente').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-black font-sans relative">
      
      {/* --- MODAL DE CONFIRMACIÓN PERSONALIZADO (Reemplaza al cartel feo) --- */}
      {modalConfirm.abierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-[#002d5a]/10 transform animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-black mb-2">¿Eliminar pedido?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">Esta acción no se puede deshacer. El pedido desaparecerá de la base de datos.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setModalConfirm({ abierto: false, idPedido: null })}
                className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-gray-100 hover:bg-gray-50 transition-colors text-black"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEliminacion}
                className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-black text-white hover:bg-red-600 transition-all shadow-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-10 border-b-2 border-black pb-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Gestión de Ventas</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IMA SPORTS LIGHTING - Panel de Control</p>
          </div>
          <Link href="/admin" className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase hover:opacity-80 transition-all">
            ← Volver a Stock
          </Link>
        </div>

        {/* ESTADÍSTICAS */}
        {!cargando && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-[2rem] border border-[#002d5a]/20 shadow-sm">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ventas Totales</p>
              <p className="text-3xl font-black italic tracking-tighter text-black">${totalVendido.toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-[#002d5a]/20 shadow-sm">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cant. Pedidos</p>
              <p className="text-3xl font-black italic tracking-tighter text-black">{pedidos.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-[#002d5a]/20 shadow-sm">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">En Espera</p>
              <p className="text-3xl font-black italic tracking-tighter text-yellow-600">{pedidosPendientes}</p>
            </div>
          </div>
        )}

        {cargando ? (
          <div className="text-center py-20 font-black uppercase italic animate-pulse">Cargando base de datos...</div>
        ) : (
          <div className="grid gap-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#002d5a]/20 flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden transition-all hover:border-[#002d5a]/50">
                
                {/* INFO CLIENTE */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] bg-gray-100 px-2 py-1 rounded font-black text-gray-400 uppercase">
                      ID: {pedido.id.slice(0, 8)}
                    </span>
                    <span className={`text-[9px] px-2 py-1 rounded font-black uppercase ${pedido.metodo_pago === 'transferencia' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {pedido.metodo_pago}
                    </span>
                  </div>
                  <h2 className="text-xl font-black uppercase italic leading-none">{pedido.nombre} {pedido.apellido}</h2>
                  <p className="text-gray-400 font-bold text-xs mt-1">{pedido.direccion}, {pedido.ciudad}</p>
                  
                  <div className="flex gap-2 mt-4">
                    <a 
                      href={`https://wa.me/${pedido.telefono?.replace(/\D/g, '')}?text=Hola%20${pedido.nombre}!%20Somos%20de%20IMA%20SPORTS.%20Recibimos%20tu%20pedido%20de:%20${pedido.productos.map((p:any)=>p.titulo).join(', ')}`}
                      target="_blank"
                      className="bg-[#25D366] text-white px-4 py-2 rounded-xl font-black uppercase text-[9px] flex items-center gap-2 hover:scale-105 transition-transform shadow-sm"
                    >
                      WhatsApp 📱
                    </a>
                    <button 
                      onClick={() => copiarAlPortapapeles(pedido.email)}
                      className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-black uppercase text-[9px] hover:bg-gray-200"
                    >
                      Email ✉️
                    </button>
                  </div>
                </div>

                {/* PRODUCTOS COMPRADOS */}
                <div className="flex-[1.5] bg-gray-50 rounded-2xl p-4 w-full border border-[#002d5a]/5">
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Productos</p>
                  <div className="space-y-2">
                    {pedido.productos.map((prod: any, i: number) => (
                      <div key={i} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0">
                        <span className="font-bold text-[11px] uppercase truncate max-w-[250px]">{prod.titulo}</span>
                        <span className="font-black text-[11px]">x{prod.cantidadSeleccionada}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOTAL Y ACCIONES */}
                <div className="text-right w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 flex flex-col items-end">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Total Pagado</p>
                  <p className="text-3xl font-black italic tracking-tighter text-black">${pedido.total.toLocaleString('es-AR')}</p>
                  <div className="mt-3 flex gap-2 items-center">
                    <div className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {pedido.estado_pago || 'Pendiente'}
                    </div>
                    {/* BOTÓN ELIMINAR - AHORA ABRE EL MODAL */}
                    <button 
                      onClick={() => setModalConfirm({ abierto: true, idPedido: pedido.id })}
                      className="p-2 bg-gray-100 text-black rounded-lg hover:bg-black hover:text-white transition-all group"
                      title="Eliminar pedido"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pedidos.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-[#002d5a]/10">
                <p className="font-black uppercase text-gray-300 italic">Todavía no hay ventas registradas</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}