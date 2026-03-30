'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import Link from 'next/link';
import Swal from 'sweetalert2'; // Importamos la librería de alertas

type Producto = {
  id: number; titulo: string; precioDescuento: number; precioOriginal: number | null;
  imagen: string; imagen2: string | null; imagen3: string | null; imagen4: string | null;
  imagen5?: string | null; imagen6?: string | null;
  categoria: string; stock: number; descripcion?: string;
  video_url?: string | null; 
};

type Comentario = {
  id: number;
  usuario_nombre: string;
  contenido: string;
  estrellas: number;
  created_at: string;
  foto_url?: string | null; // Nueva: Foto de la reseña
  compra_verificada: boolean; // Nueva: Check azul de compra
};

function RevelarAlHacerScroll({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const domRef = useRef<any>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setVisible(true); });
    });
    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);
  return <div ref={domRef} className={`transition-all duration-1000 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>{children}</div>;
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [imagenPrincipal, setImagenPrincipal] = useState<string | null>(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargandoPago, setCargandoPago] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]); 
  const [resenasGlobales, setResenasGlobales] = useState<Comentario[]>([]); // Para el Home
  const [nuevoComentario, setNuevoComentario] = useState(""); 
  const [fotoResena, setFotoResena] = useState(""); // URL final de la foto
  const [subiendoFoto, setSubiendoFoto] = useState(false); // Estado de carga

  const [mostrarNavbar, setMostrarNavbar] = useState(true);
  const [ultimoScrollY, setUltimoScrollY] = useState(0);

  useEffect(() => {
    const controlarNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > ultimoScrollY && window.scrollY > 100) {
          setMostrarNavbar(false);
        } else {
          setMostrarNavbar(true);
        }
        setUltimoScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', controlarNavbar);
    return () => window.removeEventListener('scroll', controlarNavbar);
  }, [ultimoScrollY]);

  const ADMIN_EMAIL = "imasportlight@gmail.com";
  const WHATSAPP_NUM = "5492323589289"; 

  const [user, setUser] = useState<any>(null);
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const [mostrarContacto, setMostrarContacto] = useState(false);
  const [captchaValido, setCaptchaValido] = useState(false);
  const formContacto = useRef<HTMLFormElement>(null);

  const [fotoActual, setFotoActual] = useState(0);
  const fotosHero = ['/h1.jpg', '/h2.jpg', '/h3.jpg'];
  const categorias = ["Todos", "Iluminación", "Herramientas", "Infladores", "Seguridad", "Accesorios"];

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from('productos').select('*');
      if (data) setProductos(data.map((p: any) => ({
        id: p.id, titulo: p.titulo, precioDescuento: p.precio_descuento,
        precioOriginal: p.precio_original, 
        imagen: p.imagen_url, imagen2: p.imagen_url_2, imagen3: p.imagen_url_3, 
        imagen4: p.imagen_url_4, imagen5: p.imagen_url_5, imagen6: p.imagen_url_6, 
        categoria: p.categoria || "Accesorios", stock: p.stock || 0, descripcion: p.descripcion,
        video_url: p.video_url 
      })));

      // Cargamos las reseñas globales para el Home
      const { data: resenas } = await supabase.from('comentarios').select('*').limit(6).order('created_at', { ascending: false });
      if (resenas) setResenasGlobales(resenas);
    };
    cargar();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    const timer = setInterval(() => setFotoActual((prev) => (prev + 1) % fotosHero.length), 5000);
    return () => { subscription.unsubscribe(); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (productoSeleccionado) {
      const cargarComentarios = async () => {
        const { data } = await supabase
          .from('comentarios')
          .select('*')
          .eq('producto_id', productoSeleccionado.id)
          .order('created_at', { ascending: false });
        if (data) setComentarios(data);
      };
      cargarComentarios();
    }
  }, [productoSeleccionado]);

  // FUNCIÓN PARA SUBIR FOTO AL STORAGE
  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `resenas/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('fotos-resenas').upload(filePath, file);

    if (uploadError) {
      Swal.fire('Error', 'No se pudo subir la imagen', 'error');
    } else {
      const { data } = supabase.storage.from('fotos-resenas').getPublicUrl(filePath);
      setFotoResena(data.publicUrl);
    }
    setSubiendoFoto(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (esRegistro) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { first_name: nombre, last_name: apellido, phone: telefono }, emailRedirectTo: window.location.origin }
      });
      if (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, confirmButtonColor: '#002d5a' });
      } else {
        Swal.fire({
          icon: 'success',
          title: '¡Casi listo!',
          text: 'Revisa tu email para confirmar el registro.',
          confirmButtonColor: '#002d5a'
        });
        setMostrarAuth(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Swal.fire({ icon: 'error', title: 'Error de acceso', text: error.message, confirmButtonColor: '#002d5a' });
      } else {
        setMostrarAuth(false);
      }
    }
  };

  const enviarContactoWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if(!captchaValido) {
      return Swal.fire({ icon: 'warning', text: 'Por favor, confirma que no eres un robot 🚲', confirmButtonColor: '#002d5a' });
    }
    const formData = new FormData(formContacto.current!);
    const nombreCliente = formData.get('from_name');
    const mensajeCliente = formData.get('message');
    const mensajeFinal = `¡Hola IMA SPORTS! 👋%0AMi nombre es: *${nombreCliente}*%0A%0A*Consulta:*%0A${mensajeCliente}`;
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUM}&text=${mensajeFinal}`, '_blank');
    setMostrarContacto(false);
    formContacto.current?.reset();
    setCaptchaValido(false);
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    const nuevoCarrito = [...carrito, { ...productoSeleccionado, cantidadSeleccionada: cantidad }];
    setCarrito(nuevoCarrito);
    setMostrarCarrito(true);
    setCantidad(1);
    localStorage.setItem('cart-ima-sports', JSON.stringify(nuevoCarrito));
  };

  const handlePublicarComentario = async () => {
    if (!nuevoComentario.trim()) return;
    const { error } = await supabase.from('comentarios').insert([
      {
        producto_id: productoSeleccionado?.id,
        usuario_nombre: user?.user_metadata?.first_name || "Cliente IMA",
        contenido: nuevoComentario,
        estrellas: 5,
        foto_url: fotoResena || null,
        compra_verificada: true 
      }
    ]);

    if (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo publicar el comentario' });
    } else {
      Swal.fire({ icon: 'success', title: '¡Gracias!', text: 'Tu opinión es muy valiosa.', confirmButtonColor: '#002d5a' });
      setNuevoComentario("");
      setFotoResena("");
      const { data } = await supabase.from('comentarios').select('*').eq('producto_id', productoSeleccionado?.id).order('created_at', { ascending: false });
      if (data) setComentarios(data);
    }
  };

  const calcularDescuento = (orig: number, desc: number) => {
    if (!orig || orig <= desc) return null;
    return Math.round(((orig - desc) / orig) * 100);
  };

  const filtrados = productos.filter(p => (categoriaActiva === "Todos" || p.categoria === categoriaActiva) && p.titulo.toLowerCase().includes(busqueda.toLowerCase()));
  const productosSimilares = productoSeleccionado ? productos.filter(p => p.categoria === productoSeleccionado.categoria && p.id !== productoSeleccionado.id).slice(0, 4) : [];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-6 md:px-12 py-5 bg-[#002d5a] border-b border-[#00c2cb]/20 z-[100] text-white shadow-2xl transition-transform duration-500 ${mostrarNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex-1 flex gap-4 items-center">
            <button onClick={() => setMostrarContacto(true)} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white transition-colors">Contacto</button>
            {user?.email === ADMIN_EMAIL && <button onClick={() => window.location.href = '/admin'} className="text-[9px] font-black uppercase bg-red-600 text-white px-3 py-1 rounded-full shadow-lg">Admin ⚙️</button>}
        </div> 
        <div className="flex-1 flex justify-center text-white">
            <h1 onClick={() => {setProductoSeleccionado(null); window.scrollTo(0,0);}} className="text-2xl font-black italic tracking-tighter cursor-pointer text-white uppercase text-center">IMA SPORTS LIGHTING</h1>
        </div>
        <div className="flex-1 flex justify-end items-center gap-5">
          <div className="relative hidden lg:block">
            <input 
              type="text" 
              placeholder="BUSCAR..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="bg-white/10 border border-white/20 rounded-full px-4 py-1 text-[10px] font-black uppercase outline-none focus:bg-white focus:text-black transition-all w-40"
            />
          </div>
          <button onClick={() => setMostrarAuth(true)} className="group flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:border-white transition-all bg-white/5 overflow-hidden">
              {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} /> : "👤"}
            </div>
            <span className="hidden md:block text-[10px] font-black uppercase">{user ? (user.user_metadata.first_name || "Mi Cuenta") : "Mi Cuenta"}</span>
          </button>
          <button onClick={() => setMostrarCarrito(true)} className="relative p-2 bg-black text-white rounded-full hover:bg-white hover:text-black transition-all shadow-lg active:scale-90 border border-white/10">
            <span className="text-sm">🛒</span>
            {carrito.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold animate-bounce">{carrito.length}</span>}
          </button>
        </div>
      </nav>

      <div className="h-[75px]"></div>

      {/* PANEL CONTACTO */}
      <div className={`fixed inset-0 z-[120] transition-all duration-500 ${mostrarContacto ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMostrarContacto(false)} />
        <div className={`absolute right-0 top-0 h-full bg-white w-full max-w-md p-8 transform transition-transform duration-500 ${mostrarContacto ? 'translate-x-0' : 'translate-x-full'}`}>
          <h2 className="text-2xl font-black uppercase italic mb-8 text-black">Contactanos</h2>
          <form ref={formContacto} onSubmit={enviarContactoWhatsApp} className="space-y-4">
            <input name="from_name" placeholder="Tu Nombre" required className="w-full border-2 p-3 rounded-xl outline-none focus:border-black text-black" />
            <textarea name="message" placeholder="¿En qué podemos ayudarte?" rows={4} required className="w-full border-2 p-3 rounded-xl outline-none focus:border-black text-black" />
            <label className="flex items-center gap-2 text-xs font-bold uppercase text-black"><input type="checkbox" checked={captchaValido} onChange={e => setCaptchaValido(e.target.checked)} /> No soy un robot 🚲</label>
            <button className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black uppercase flex items-center justify-center gap-2 shadow-lg">Enviar a WhatsApp</button>
          </form>
        </div>
      </div>

      {/* PANEL AUTH */}
      <div className={`fixed inset-0 z-[120] transition-all duration-500 ${mostrarAuth ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMostrarAuth(false)} />
        <div className={`absolute right-0 top-0 h-full bg-white w-full max-w-md p-8 transform transition-transform duration-500 ${mostrarAuth ? 'translate-x-0' : 'translate-x-full'}`}>
          <h2 className="text-2xl font-black uppercase italic mb-8 text-black">{user ? "Mi Cuenta" : "Bienvenido"}</h2>
          {user ? (
            <div className="text-black">
              <p className="font-bold">{user.email}</p>
              <button onClick={() => supabase.auth.signOut()} className="mt-8 w-full border-2 border-black py-4 font-black uppercase text-xs text-black">Cerrar Sesión</button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4 text-black">
              {esRegistro && <input placeholder="Nombre" required className="w-full border-2 p-3 rounded-xl text-black" onChange={e => setNombre(e.target.value)} />}
              <input placeholder="Email" type="email" required className="w-full border-2 p-3 rounded-xl text-black" onChange={e => setEmail(e.target.value)} />
              <input placeholder="Password" type="password" required className="w-full border-2 p-3 rounded-xl text-black" onChange={e => setPassword(e.target.value)} />
              <button className="w-full bg-black text-white py-4 rounded-xl font-black uppercase"> {esRegistro ? "Registrarse" : "Entrar"}</button>
              <p onClick={() => setEsRegistro(!esRegistro)} className="text-center text-[10px] font-black uppercase text-gray-400 cursor-pointer">{esRegistro ? "¿Ya tenés cuenta? Logueate" : "¿No tenés cuenta? Registrate"}</p>
            </form>
          )}
        </div>
      </div>

      {/* PANEL CARRITO */}
      <div className={`fixed inset-0 z-[120] transition-all duration-500 ${mostrarCarrito ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMostrarCarrito(false)} />
        <div className={`absolute right-0 top-0 h-full bg-white w-full max-w-md p-8 transform transition-transform duration-500 ${mostrarCarrito ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <h2 className="text-2xl font-black uppercase italic mb-8 text-black">Tu Carrito</h2>
          <div className="flex-1 overflow-y-auto space-y-4 text-black">
            {carrito.length === 0 ? (
              <p className="text-center text-gray-400 uppercase font-black text-[10px] mt-10">El carrito está vacío</p>
            ) : (
              carrito.map((item, i) => (
                <div key={i} className="flex gap-4 border-b pb-4">
                  <img src={item.imagen} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="font-black uppercase text-xs text-black">{item.titulo}</p>
                    <p className="font-bold text-sm text-gray-500">${item.precioDescuento.toLocaleString()} <span className="text-black">x {item.cantidadSeleccionada}</span></p>
                  </div>
                  <button onClick={() => {
                    const nuevo = carrito.filter((_, idx) => idx !== i);
                    setCarrito(nuevo);
                    localStorage.setItem('cart-ima-sports', JSON.stringify(nuevo));
                  }} className="text-red-500 text-[10px] font-black uppercase">Borrar</button>
                </div>
              ))
            )}
          </div>
          {carrito.length > 0 && (
            <div className="pt-6 border-t border-gray-100 bg-white">
                <div className="flex justify-between mb-6 font-black uppercase italic text-black">
                  <span className="text-sm">Total del pedido</span>
                  <span className="text-xl">${carrito.reduce((acc, p) => acc + (p.precioDescuento * p.cantidadSeleccionada), 0).toLocaleString()}</span>
                </div>
                <Link 
                  href="/checkout"
                  className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-red-600 group"
                >
                  Finalizar Compra 🚀
                </Link>
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO DINÁMICO */}
      {productoSeleccionado ? (
        <div className="max-w-7xl mx-auto px-6 py-12 text-black animate-in fade-in duration-500">
            <button onClick={() => setProductoSeleccionado(null)} className="mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-all">← Volver al catálogo</button>
            <div className="flex flex-col lg:flex-row gap-12 items-start bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 mb-20">
              <div className="w-full lg:w-[450px] flex flex-col-reverse md:flex-row gap-4 shrink-0 mx-auto lg:mx-0">
                <div className="flex flex-row md:flex-col gap-2 md:w-16 shrink-0 overflow-x-auto pb-2 md:pb-0">
                  {[productoSeleccionado.imagen, productoSeleccionado.imagen2, productoSeleccionado.imagen3, productoSeleccionado.imagen4, productoSeleccionado.imagen5, productoSeleccionado.imagen6].filter(Boolean).map((img, i) => (
                    <div key={i} onClick={() => setImagenPrincipal(img!)} className={`w-14 h-14 md:w-full aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 bg-white ${imagenPrincipal === img || (!imagenPrincipal && i === 0) ? 'border-black' : 'border-transparent'}`}>
                      <img src={img!} className="w-full h-full object-contain p-1" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-white flex items-center justify-center h-[350px] md:h-[400px] relative overflow-hidden rounded-3xl">
                   {calcularDescuento(productoSeleccionado.precioOriginal!, productoSeleccionado.precioDescuento) && (
                     <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse z-10">-{calcularDescuento(productoSeleccionado.precioOriginal!, productoSeleccionado.precioDescuento)}% OFF</span>
                   )}
                  
                  {productoSeleccionado.video_url ? (
                    <video src={productoSeleccionado.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={imagenPrincipal || productoSeleccionado.imagen} className="max-w-full max-h-full object-contain" />
                  )}
                </div>
              </div>
              <div className="flex-1 text-black flex flex-col h-full lg:pt-4">
                <span className="text-[9px] font-black uppercase text-red-600 mb-2 tracking-widest bg-red-50 px-3 py-1 rounded-full self-start">{productoSeleccionado.categoria}</span>
                <h1 className="text-3xl font-black uppercase italic mb-4 tracking-tighter leading-[1]">{productoSeleccionado.titulo}</h1>
                <div className="text-gray-500 mb-6 leading-relaxed whitespace-pre-line border-t border-b py-6 border-gray-100 text-sm">{productoSeleccionado.descripcion}</div>
                <div className="flex items-center gap-4 mb-8 text-black">
                  <p className="text-4xl font-black tracking-tighter">${productoSeleccionado.precioDescuento.toLocaleString('es-AR')}</p>
                  {productoSeleccionado.precioOriginal && productoSeleccionado.precioOriginal > productoSeleccionado.precioDescuento && (
                     <p className="text-lg text-gray-400 line-through font-bold decoration-2">${productoSeleccionado.precioOriginal.toLocaleString('es-AR')}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  <div className="flex items-center justify-between border-2 border-gray-100 rounded-2xl p-1 bg-gray-50 min-w-[140px]">
                    <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="px-5 py-2 font-black text-xl hover:text-red-600 transition-colors">-</button>
                    <span className="font-black text-lg">{cantidad}</span>
                    <button onClick={() => setCantidad(Math.min(productoSeleccionado.stock, cantidad + 1))} className="px-5 py-2 font-black text-xl hover:text-red-600 transition-colors">+</button>
                  </div>
                  <button onClick={agregarAlCarrito} className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-red-600 transition-all active:scale-95">Añadir al Carrito</button>
                </div>
              </div>
            </div>
            
            {/* RECOMENDADOS */}
            {productosSimilares.length > 0 && (
              <div className="mt-20 border-t border-gray-100 pt-16">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-10 text-center">Te recomendamos estos 🚀</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {productosSimilares.map(p => (
                    <div key={p.id} onClick={() => { setProductoSeleccionado(p); setImagenPrincipal(p.imagen); setCantidad(1); window.scrollTo(0,0); }} className="group cursor-pointer">
                      <div className="aspect-square rounded-[2rem] overflow-hidden bg-gray-100 mb-6 relative flex items-center justify-center border border-transparent group-hover:border-gray-200">
                         <img src={p.imagen} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                      </div>
                      <h3 className="font-black text-[13px] uppercase italic line-clamp-2">{p.titulo}</h3>
                      <p className="font-black text-xl">${p.precioDescuento.toLocaleString('es-AR')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN DE COMENTARIOS MEJORADA CON SUBIDA DE FOTO */}
            <div className="mt-20 border-t border-gray-100 pt-16 max-w-4xl mx-auto">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-12 text-center">Opiniones Reales ⚡</h2>
              
              {user ? (
                <div className="bg-gray-50 p-8 rounded-[3rem] mb-12 border border-gray-100 shadow-sm">
                  <p className="font-black uppercase text-[10px] mb-6 text-gray-400 tracking-[0.2em]">Escribí tu reseña</p>
                  <textarea 
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Contanos tu experiencia..."
                    className="w-full p-6 rounded-[2rem] border-2 border-transparent focus:border-black outline-none text-black mb-4 h-32 transition-all shadow-inner bg-white"
                  />
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <label className="flex-1 cursor-pointer bg-white border-2 border-dashed border-gray-200 p-4 rounded-full text-center hover:border-black transition-all">
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        {subiendoFoto ? "Cargando..." : fotoResena ? "✅ Foto lista" : "📸 Subir foto de mi producto"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSubirFoto} />
                    </label>
                    <button 
                      onClick={handlePublicarComentario}
                      className="w-full md:w-auto bg-black text-white px-12 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center bg-gray-50 p-10 rounded-[3rem] mb-12 border-2 border-dashed border-gray-200">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Logueate para dejar tu opinión</p>
                  <button onClick={() => setMostrarAuth(true)} className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase">Ingresar ahora 👤</button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comentarios.length === 0 ? (
                  <p className="col-span-2 text-center text-gray-300 font-black uppercase text-[10px] italic py-20 tracking-[0.3em]">Nadie comentó todavía. ¡Sé el primero!</p>
                ) : (
                  comentarios.map((c) => (
                    <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-12 h-12 rounded-full bg-[#002d5a] text-white flex items-center justify-center font-black text-sm border-4 border-gray-50 overflow-hidden shrink-0">
                          {c.usuario_nombre[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-black uppercase text-xs text-black">{c.usuario_nombre}</p>
                            {c.compra_verificada && (
                              <span className="bg-blue-50 text-blue-600 text-[7px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-100 uppercase">
                                ✓ Comprador
                              </span>
                            )}
                          </div>
                          <div className="flex text-yellow-400 text-[10px] mt-1">
                            {"★".repeat(c.estrellas)}{"☆".repeat(5 - c.estrellas)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed italic mb-6">"{c.contenido}"</p>
                      {c.foto_url && (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-gray-50 mb-4 cursor-zoom-in">
                          <img src={c.foto_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      )}
                      <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">
                        {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>
      ) : (
        <>
          <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-black text-center text-white">
            {fotosHero.map((img, index) => (
              <img key={index} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === fotoActual ? 'opacity-60' : 'opacity-0'}`} />
            ))}
            <div className="relative z-10 text-white px-4">
              <RevelarAlHacerScroll>
                <h1 className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.85] mb-8 text-white">NADA TE <br/> DETIENE</h1>
                <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'})} className="bg-white text-black px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white shadow-2xl transition-all">Explorar Colección</button>
              </RevelarAlHacerScroll>
            </div>
          </section>
          
          <main id="catalogo" className="max-w-7xl mx-auto px-4 py-24 text-black">
            <div className="flex flex-wrap gap-2 mb-16 justify-center">
              {categorias.map(c => <button key={c} onClick={() => setCategoriaActiva(c)} className={`px-6 py-2 rounded-full text-[10px] font-black border-2 transition-all ${categoriaActiva === c ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100 hover:border-black"}`}>{c.toUpperCase()}</button>)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {filtrados.map(p => (
                <div key={p.id} onClick={() => { setProductoSeleccionado(p); setImagenPrincipal(p.imagen); setCantidad(1); window.scrollTo(0,0); }} className="group cursor-pointer">
                  <div className="aspect-square rounded-[2rem] overflow-hidden bg-gray-100 mb-6 relative flex items-center justify-center border border-transparent group-hover:border-gray-200 transition-all">
                    {calcularDescuento(p.precioOriginal!, p.precioDescuento) && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg animate-pulse">
                        -{calcularDescuento(p.precioOriginal!, p.precioDescuento)}% OFF
                      </div>
                    )}
                    <img src={p.imagen} className={`w-full h-full object-cover transition-all duration-700 ${p.imagen2 ? 'group-hover:opacity-0 group-hover:scale-110' : 'group-hover:scale-110'}`} />
                    {p.imagen2 && <img src={p.imagen2} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-110" />}
                  </div>
                  <div className="px-1">
                    <h3 className="font-black text-[13px] uppercase italic line-clamp-2 min-h-[32px]">{p.titulo}</h3>
                    <div className="flex items-baseline gap-2">
                       <p className="font-black text-2xl">${p.precioDescuento.toLocaleString()}</p>
                       {p.precioOriginal && p.precioOriginal > p.precioDescuento && <p className="text-xs text-gray-400 line-through">${p.precioOriginal.toLocaleString()}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* SECCIÓN AZUL DE TESTIMONIOS EN EL HOME */}
          <section className="bg-[#002d5a] py-24 text-white overflow-hidden">
              <div className="max-w-7xl mx-auto px-6">
                  <RevelarAlHacerScroll>
                      <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-16 text-center">LA COMUNIDAD <br/> IMA SPORTS 🚲</h2>
                  </RevelarAlHacerScroll>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {resenasGlobales.map((r) => (
                          <div key={r.id} className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-4 mb-6">
                                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black">{r.usuario_nombre[0]}</div>
                                  <div>
                                      <p className="text-xs font-black uppercase tracking-widest">{r.usuario_nombre}</p>
                                      {r.compra_verificada && <p className="text-[8px] text-blue-400 font-bold uppercase">Compra Verificada ✓</p>}
                                  </div>
                              </div>
                              <p className="text-sm italic font-medium mb-6 text-gray-300">"{r.contenido}"</p>
                              {r.foto_url && (
                                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/10">
                                      <img src={r.foto_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </section>
        </>
      )}
    </div>
  );
}