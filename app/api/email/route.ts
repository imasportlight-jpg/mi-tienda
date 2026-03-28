import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, nombre, total, productos, idPedido } = await request.json();

    const data = await resend.emails.send({
      from: 'IMA sports lighting <onboarding@resend.dev>',
      to: [email],
      subject: `💡 ¡Pedido #${idPedido} Confirmado! - IMA sports lighting`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f4f7f9; padding: 20px; color: #002d5a;">
          
          <div style="background-color: #ffffff; border-radius: 15px; overflow: hidden; border: 1px solid #e1e8ed;">
            
            <div style="background-color: #002d5a; padding: 35px 30px; border-bottom: 6px solid #00c2cb;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <div style="width: 40px; height: 3px; background-color: #00c2cb; margin-bottom: 10px;"></div>
                      <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; font-style: italic; text-transform: uppercase; letter-spacing: -1px;">IMA</h1>
                      <p style="color: #88a3b9; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">sports lighting</p>
                    </td>
                    <td style="text-align: right; vertical-align: bottom;">
                      <span style="color: #ffffff; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6;">Confirmación</span>
                    </td>
                  </tr>
                </table>
            </div>

            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #002d5a; margin-top: 0;">Hola <strong>${nombre}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.6; color: #5c7c94;">¡Tu pedido está en marcha! Ya nos pusimos a trabajar para que tengas tus luces <strong>IMA sports lighting</strong> lo antes posible.</p>

              <div style="margin-top: 40px;">
                <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #002d5a; margin-bottom: 15px; border-bottom: 1px solid #f0f4f8; padding-bottom: 10px;">Resumen de Compra #${idPedido}</h2>
                
                <div style="margin-bottom: 25px;">
                  ${productos.map((p: any) => `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fcfe; margin-bottom: 10px; border-radius: 8px; border: 1px solid #eef2f5;">
                      <tr>
                        <td style="padding: 15px; font-size: 14px; color: #002d5a;">
                          <strong>${p.titulo}</strong>
                          <div style="color: #5c7c94; font-size: 12px; margin-top: 4px;">Cantidad: ${p.cantidadSeleccionada}</div>
                        </td>
                        <td style="padding: 15px; font-size: 15px; font-weight: bold; color: #002d5a; text-align: right; white-space: nowrap;">
                          $${(p.precioDescuento * p.cantidadSeleccionada).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    </table>
                  `).join('')}
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #002d5a; color: #ffffff; border-radius: 12px;">
                  <tr>
                    <td style="padding: 20px 25px; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                      TOTAL FINAL
                    </td>
                    <td style="padding: 20px 25px; font-size: 28px; font-weight: bold; text-align: right; color: #00c2cb;">
                      $${total.toLocaleString('es-AR')}
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 35px; padding: 20px; border: 2px dashed #00c2cb; border-radius: 12px; background-color: #ffffff; text-align: center;">
                  <strong style="color: #002d5a; font-size: 14px; text-transform: uppercase; display: block; margin-bottom: 10px;">⚠️ Aviso de Pago:</strong>
                  <p style="font-size: 13px; color: #5c7c94; margin-bottom: 15px; line-height: 1.5;">Si elegiste <strong>transferencia bancaria</strong>, recordá enviarnos el comprobante por WhatsApp para procesar tu envío.</p>
                  <a href="https://wa.me/541158567474" style="display: inline-block; background-color: #25D366; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                    Enviar Comprobante 📱
                  </a>
              </div>

              <div style="margin-top: 30px; text-align: center;">
                <img src="https://logodownload.org/wp-content/uploads/2014/07/visa-logo-1.png" height="12" style="margin: 0 10px; opacity: 0.6;" />
                <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-3.png" height="20" style="margin: 0 10px; opacity: 0.6;" />
                <img src="https://brand.mercadopago.com/static/images/logo-mercadopago.png" height="18" style="margin: 0 10px; opacity: 0.6;" />
              </div>

              <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f0f4f8; padding-top: 20px;">
                <p style="font-size: 12px; color: #002d5a; font-weight: bold; margin-bottom: 4px;">IMA sports lighting</p>
                <p style="font-size: 11px; color: #abbcc9; margin: 0;">Luján, Buenos Aires, Argentina</p>
              </div>

            </div>
          </div>
        </div>
      `,
    });

    console.log("📧 Mail enviado con éxito a:", email);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ Error enviando mail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}