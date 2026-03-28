import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: 'TEST-8059481174680658-032308-df6b665ed338aadb570b298e9e70e781-47338991' 
});

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    console.log("📦 Items recibidos para procesar:", items.length);

    const preference = new Preference(client);
    
    // Mapeo ultra-seguro de datos
    const itemsFormateados = items.map((item: any) => ({
      id: item.id?.toString() || 'prod',
      title: item.titulo || item.title,
      unit_price: Number(item.precioDescuento || item.unit_price),
      quantity: Number(item.cantidadSeleccionada || item.quantity),
      currency_id: 'ARS'
    }));

    const response = await preference.create({
      body: {
        items: itemsFormateados,
        back_urls: {
          success: "http://localhost:3000/success",
          failure: "http://localhost:3000/checkout",
          pending: "http://localhost:3000/success"
        },
        // SACAMOS auto_return para evitar el error de validación en localhost
        external_reference: `IMA-${Date.now()}`,
      }
    });

    console.log("✅ Preferencia generada con éxito:", response.id);
    return NextResponse.json({ id: response.id });

  } catch (error: any) {
    console.error("❌ ERROR MERCADO PAGO:");
    if (error.response) {
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Mensaje:", error.message || error);
    }

    return NextResponse.json(
      { error: "Error al generar el pago" }, 
      { status: 500 }
    );
  }
}