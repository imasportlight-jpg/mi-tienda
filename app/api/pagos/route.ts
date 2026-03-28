import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Usamos la variable de entorno de Vercel para seguridad
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    console.log("📦 Procesando productos para IMA Sports:", items.length);

    // Mapeo de datos para Mercado Pago
    const itemsFormateados = items.map((item: any) => ({
      id: item.id?.toString() || 'prod',
      title: item.titulo || item.title || 'Producto IMA Sports',
      unit_price: Number(item.precioDescuento || item.unit_price || item.precio),
      quantity: Number(item.cantidadSeleccionada || item.quantity || 1),
      currency_id: 'ARS'
    }));

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: itemsFormateados,
        back_urls: {
          // Cambié esto por tu URL de Vercel
          success: "https://mi-tienda-sigma-gray.vercel.app/success",
          failure: "https://mi-tienda-sigma-gray.vercel.app/cart",
          pending: "https://mi-tienda-sigma-gray.vercel.app/pending"
        },
        auto_return: "approved",
      }
    });

    console.log("✅ Preferencia generada:", response.id);
    return NextResponse.json({ id: response.id });

  } catch (error: any) {
    console.error("❌ ERROR MERCADO PAGO:", error);
    return NextResponse.json(
      { error: "Error al generar el pago", details: error.message }, 
      { status: 500 }
    );
  }
}