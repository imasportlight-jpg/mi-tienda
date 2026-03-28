'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function CheckoutPage() {
  const [carrito, setCarrito] = useState<any[]>([]);
  const [metodoPago, setMetodoPago] = useState<'mercadopago' | 'transferencia'>('mercadopago');
  const [cargando, setCargando] = useState(false);
  
  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: ''
  });

  useEffect(() => {
    const carritoGuardado = localStorage.getItem('cart-ima-sports');
    if (carritoGuardado) setCarrito(JSON.parse(carritoGuardado));
  }, []);

  const subtotal = carrito.reduce((acc, p) => acc + (p.precioDescuento * p.cantidadSeleccionada), 0);
  const totalFinal = metodoPago === 'transferencia' ? subtotal * 0.90 : subtotal;

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const manejarCompra = async (e: React.FormEvent) => {
    e.preventDefault();

    if (carrito.length === 0) return alert("Tu carrito está vacío");
    if (!datos.nombre || !datos.direccion || !datos.email) {
      return alert("Por favor, completa los datos de envío requeridos.");
    }

    setCargando(true);
    
    try {
      // 1. GUARDAR PEDIDO EN SUPABASE
      const { data: pedidoGuardado, error: errorSupabase } = await supabase
        .from('pedidos')
        .insert([{
          nombre: datos.nombre,
          apellido: datos.apellido,
          email: datos.email,
          telefono: datos.telefono,
          direccion: datos.direccion,
          ciudad: datos.ciudad,
          productos: carrito,
          total: totalFinal,
          metodo_pago: metodoPago,
          estado_pago: 'pendiente'
        }])
        .select();

      if (errorSupabase) throw new Error("Error al guardar en base de datos");

      const idPedidoCorto = pedidoGuardado[0].id.slice(0, 8);

      // 2. LÓGICA DE STOCK: DESCONTAR CANTIDADES
      for (const item of carrito) {
        const { data: productoActual } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (productoActual) {
          const nuevoStock = productoActual.stock - item.cantidadSeleccionada;
          await supabase
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', item.id);
        }
      }

      // 3. ENVIAR EMAIL DE CONFIRMACIÓN
      try {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: datos.email,
            nombre: datos.nombre,
            total: totalFinal,
            productos: carrito,
            idPedido: idPedidoCorto
          }),
        });
        console.log("📧 Email de confirmación enviado");
      } catch (errorMail) {
        console.error("❌ No se pudo enviar el mail:", errorMail);
      }

      // 4. PROCESAR SEGÚN MÉTODO DE PAGO
      if (metodoPago === 'mercadopago') {
        const res = await fetch('/api/pagos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            items: carrito.map(p => ({
              title: p.titulo,
              unit_price: p.precioDescuento,
              quantity: p.cantidadSeleccionada,
              currency_id: 'ARS'
            })) 
          }),
        });
        
        const data = await res.json();
        
        if (data.id) {
          await supabase.from('pedidos').update({ mp_preference_id: data.id }).eq('id', pedidoGuardado[0].id);
          window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`;
        } else {
          alert("Error al generar el pago de Mercado Pago");
        }
      } else {
        // Opción Transferencia vía WhatsApp
        const mensaje = `¡Hola IMA SPORTS! 👋%0AHe realizado un pedido por *Transferencia* (ID: ${idPedidoCorto}).%0A%0A*Datos de Envío:*%0A- Cliente: ${datos.nombre} ${datos.apellido}%0A- Dirección: ${datos.direccion}, ${datos.ciudad}%0A%0A*Pedido:*%0A${carrito.map(p => `- ${p.titulo} (x${p.cantidadSeleccionada})`).join('%0A')}%0A%0A*Total a transferir: $${totalFinal.toLocaleString('es-AR')}*`;
        window.open(`https://wa.me/541158567474?text=${mensaje}`, '_blank');
        window.location.href = '/success';
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error al procesar tu pedido. Reintentá en unos momentos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 text-black font-sans">
      <Link href="/" className="font-black uppercase italic mb-10 inline-block text-xs">← Volver a la tienda</Link>
      
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 text-black">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="space-y-8 text-black">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-black">Finalizar Compra</h1>
          
          <form onSubmit={manejarCompra} className="space-y-4 text-black">
            <h2 className="font-black uppercase text-sm border-b pb-2 text-black">1. Datos de Entrega</h2>
            <div className="grid grid-cols-2 gap-4">
              <input name="nombre" placeholder="Nombre" onChange={manejarCambio} required className="border-2 p-3 rounded-xl outline-none focus:border-black bg-gray-50 font-bold text-black" />
              <input name="apellido" placeholder="Apellido" onChange={manejarCambio} required className="border-2 p-3 rounded-xl outline-none focus:border-black bg-gray-50 font-bold text-black" />
            </div>
            <input name="email" type="email" placeholder="Email" onChange={manejarCambio} required className="w-full border-2 p-3 rounded-xl outline-none focus:border-black bg-gray-50 font-bold text-black" />
            <input name="telefono" placeholder="WhatsApp / Teléfono" onChange={manejarCambio} required className="w-full border-2 p-3 rounded-xl outline-none focus:border-black bg-gray-50 font-bold text-black" />
            <input name="direccion" placeholder="Calle y Altura" onChange={manejarCambio} required className="w-full border-2 p-3 rounded-xl outline-none focus:border-black bg-gray-50 font-bold text-black" />
            <input name="ciudad" placeholder="Ciudad" onChange={manejarCambio} required className="w-full border-2 p-3 rounded-xl outline-none focus:border-black bg-gray-50 font-bold text-black" />

            <h2 className="font-black uppercase text-sm border-b pb-2 pt-4 text-black">2. Método de Pago</h2>
            <div className="flex gap-4">
              <button type="button" onClick={() => setMetodoPago('mercadopago')} className={`flex-1 p-4 border-2 rounded-xl font-black text-[10px] uppercase transition-all ${metodoPago === 'mercadopago' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'}`}>Mercado Pago</button>
              <button type="button" onClick={() => setMetodoPago('transferencia')} className={`flex-1 p-4 border-2 rounded-xl font-black text-[10px] uppercase transition-all ${metodoPago === 'transferencia' ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'}`}>Transferencia (-10%)</button>
            </div>

            <button 
              type="submit" 
              disabled={cargando || carrito.length === 0}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest mt-6 hover:bg-red-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {cargando ? 'PROCESANDO...' : 'FINALIZAR Y PAGAR 🚀'}
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: RESUMEN */}
        <div className="lg:sticky lg:top-10 h-fit text-black">
          <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-gray-100 text-black">
            <h2 className="text-xl font-black uppercase italic mb-6 text-black">Resumen del Pedido</h2>
            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 text-black">
                {carrito.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-200 pb-4 text-black">
                    <div className="flex gap-3 text-black">
                      <img src={item.imagen} className="w-12 h-12 object-contain bg-white rounded-lg border text-black" alt="" />
                      <div className="text-black">
                        <p className="font-black text-[11px] uppercase leading-tight text-black">{item.titulo}</p>
                        <p className="text-gray-400 font-bold text-[10px] text-black">CANTIDAD: {item.cantidadSeleccionada}</p>
                      </div>
                    </div>
                    <p className="font-black text-sm text-black">${(item.precioDescuento * item.cantidadSeleccionada).toLocaleString('es-AR')}</p>
                  </div>
                ))}
            </div>
            
            <div className="space-y-2 border-t pt-4 text-black">
              <div className="flex justify-between font-bold text-gray-400 uppercase text-xs text-black"><span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span></div>
              {metodoPago === 'transferencia' && (
                <div className="flex justify-between font-bold text-red-600 uppercase text-xs text-black"><span>Descuento Transferencia</span><span>-10%</span></div>
              )}
              <div className="flex justify-between font-black text-2xl uppercase italic tracking-tighter pt-4 border-t mt-4 text-black">
                <span>Total</span>
                <span>${totalFinal.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}