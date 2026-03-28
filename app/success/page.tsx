'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function SuccessPage() {
  
  // Cuando el usuario llega acá, significa que pagó. Limpiamos el carrito local.
  useEffect(() => {
    localStorage.removeItem('cart-ima-sports');
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-black font-sans">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* ICONO DE ÉXITO */}
        <div className="relative mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
          <span className="text-4xl">✅</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
            ¡PAGO <br /> RECIBIDO!
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
            Tu pedido en IMA SPORTS ya está en camino
          </p>
        </div>

        <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-gray-100 space-y-4">
          <p className="text-sm font-medium leading-relaxed">
            ¡Gracias por confiar en nosotros! <br />
            En breve nos pondremos en contacto con vos vía <b>WhatsApp</b> para coordinar los detalles del envío.
          </p>
          <div className="pt-4">
            <p className="text-[9px] font-black uppercase text-gray-400">Nro de operación</p>
            <p className="text-[11px] font-mono font-bold">#MP-{Math.floor(Math.random() * 1000000)}</p>
          </div>
        </div>

        <Link 
          href="/" 
          className="inline-block bg-black text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95"
        >
          Volver al Inicio 🚀
        </Link>
        
        <footer className="pt-10">
          <p className="text-[9px] font-black uppercase text-gray-300 italic tracking-[0.3em]">
            IMA SPORTS LIGHTING © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}