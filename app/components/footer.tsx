import React from "react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full bg-[#001B41] text-white font-sans mt-auto">
      {/* 1. FRANJA NEGRA ÚNICA */}
      <div className="bg-black py-4 flex items-center justify-center gap-4">
        <Image 
          src="/logo-ima.png" 
          alt="IMA Logo" 
          width={35} 
          height={35} 
          className="object-contain"
        />
        <p className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase m-0">
          IMA SPORTS LIGHTING © 2026
        </p>
      </div>

      {/* 2. SECCIÓN AZUL */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Columna 1: Branding y Pagos */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-4xl font-black italic leading-none uppercase m-0">IMA</h2>
            <span className="text-[10px] tracking-[0.3em] font-light text-white/70 uppercase">Sports Lighting</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed max-w-xs m-0">
            Iluminación de alto rendimiento para potenciar tu entrenamiento.
          </p>
          {/* Métodos de Pago: Alineados y del mismo tamaño */}
          <div className="flex items-center gap-3">
            <Image src="/visa.png" alt="Visa" width={50} height={30} className="object-contain" />
            <Image src="/mastercard.png" alt="Mastercard" width={50} height={30} className="object-contain" />
            <Image src="/mercadopago.png" alt="Mercado Pago" width={50} height={30} className="object-contain bg-white p-1 rounded-sm" />
          </div>
        </div>

        {/* Columna 2: Contacto y Atención */}
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <h4 className="text-[#00CFFF] font-bold tracking-widest uppercase m-0">Contacto</h4>
            <ul className="list-none p-0 m-0 space-y-2 text-sm text-gray-200">
              <li>📍 Luján, Buenos Aires</li>
              <li>📱 +54 9 11 5856-7474</li>
              <li>✉️ imasportlight@gmail.com</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-[#00CFFF] font-bold tracking-widest uppercase m-0 text-xs opacity-80">Atención</h4>
            <p className="italic text-sm text-gray-300 m-0">LUN A VIE: 09:00 — 18:00HS</p>
          </div>
        </div>

        {/* Columna 3: Mapa */}
        <div className="space-y-4">
          <h4 className="text-[#00CFFF] font-bold tracking-widest uppercase m-0">Punto de Retiro</h4>
          <div className="rounded-xl overflow-hidden border border-white/10 h-[180px] w-full shadow-lg bg-gray-900">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.4468648174415!2d-59.1234!3d-34.5711!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDM0JzE2LjAiUyA1OcKwMDcnMjQuMiJX!5e0!3m2!1ses!2sar!4v1711470000000!5m2!1ses!2sar" 
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;