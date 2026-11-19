/* NÓMADE — lógica pura (sin DOM). Usada en navegador (global Logica) y en tests (Node). */
(function (raiz) {
  'use strict';

  var ENVIO_GRATIS_DESDE = 80000;
  var COSTO_ENVIO = 6500;
  var CUPONES = {
    NOMADE10: { tipo: 'pct', valor: 10 },
    BIENVENIDA: { tipo: 'fijo', valor: 5000 }
  };

  function formatPrecio(n) {
    var s = String(Math.round(Number(n) || 0));
    return '$' + s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function claveItem(item) {
    return item.id + '|' + item.color + '|' + item.talle;
  }

  // Unidades de un talle ya usadas por otras líneas (otros colores). El stock es por talle.
  function usadoPorOtros(carrito, id, talle, clave) {
    return carrito.reduce(function (s, i) {
      return i.id === id && i.talle === talle && claveItem(i) !== clave ? s + i.cantidad : s;
    }, 0);
  }

  function agregarItem(carrito, item, stockMax) {
    var clave = claveItem(item);
    var tope = stockMax - usadoPorOtros(carrito, item.id, item.talle, clave);
    var existe = false;
    var nuevo = carrito.map(function (i) {
      if (claveItem(i) !== clave) return i;
      existe = true;
      return Object.assign({}, i, { cantidad: Math.max(0, Math.min(i.cantidad + item.cantidad, tope)) });
    });
    if (!existe && tope > 0) {
      nuevo.push(Object.assign({}, item, { cantidad: Math.min(item.cantidad, tope) }));
    }
    return nuevo.filter(function (i) { return i.cantidad > 0; });
  }

  function cambiarCantidad(carrito, clave, cantidad, stockMax) {
    if (cantidad <= 0) return quitarItem(carrito, clave);
    return carrito.map(function (i) {
      if (claveItem(i) !== clave) return i;
      var tope = stockMax - usadoPorOtros(carrito, i.id, i.talle, clave);
      return Object.assign({}, i, { cantidad: Math.max(1, Math.min(cantidad, tope)) });
    });
  }

  // Cuánto se puede sumar todavía de un talle. Con exceptoClave, ignora esa línea (su propio máximo).
  function disponible(carrito, producto, talle, exceptoClave) {
    if (!producto) return 0;
    var usado = carrito.reduce(function (s, i) {
      return i.id === producto.id && i.talle === talle && claveItem(i) !== exceptoClave ? s + i.cantidad : s;
    }, 0);
    return Math.max(0, stockDe(producto, talle) - usado);
  }

  function quitarItem(carrito, clave) {
    return carrito.filter(function (i) { return claveItem(i) !== clave; });
  }

  function buscar(productos, id) {
    for (var i = 0; i < productos.length; i++) if (productos[i].id === id) return productos[i];
    return null;
  }

  function stockDe(producto, talle) {
    if (!producto) return 0;
    for (var i = 0; i < producto.talles.length; i++) {
      if (producto.talles[i].talle === talle) return producto.talles[i].stock;
    }
    return 0;
  }

  function limpiarCarrito(carrito, productos) {
    if (!Array.isArray(carrito)) return [];
    var res = [];
    var usado = {};
    carrito.forEach(function (i) {
      if (!i || typeof i !== 'object') return;
      var p = buscar(productos, i.id);
      var k = i.id + '|' + i.talle;
      var stock = stockDe(p, i.talle) - (usado[k] || 0);
      var cant = Math.floor(Number(i.cantidad));
      if (!p || stock <= 0 || !(cant > 0)) return;
      cant = Math.min(cant, stock);
      usado[k] = (usado[k] || 0) + cant;
      res.push({ id: i.id, color: String(i.color || ''), talle: i.talle, cantidad: cant });
    });
    return res;
  }

  function validarCupon(codigo) {
    var c = String(codigo || '').trim().toUpperCase();
    var def = CUPONES[c];
    return def ? { codigo: c, tipo: def.tipo, valor: def.valor } : null;
  }

  function calcularTotales(carrito, productos, cupon, metodoEnvio) {
    var subtotal = 0;
    carrito.forEach(function (i) {
      var p = buscar(productos, i.id);
      if (p) subtotal += p.precio * i.cantidad;
    });
    var descuento = 0;
    if (cupon) {
      descuento = cupon.tipo === 'pct' ? Math.round(subtotal * cupon.valor / 100) : cupon.valor;
      descuento = Math.min(descuento, subtotal);
    }
    var neto = subtotal - descuento;
    var envio = 0;
    if (subtotal > 0 && metodoEnvio !== 'retiro' && neto < ENVIO_GRATIS_DESDE) envio = COSTO_ENVIO;
    return {
      subtotal: subtotal,
      descuento: descuento,
      envio: envio,
      total: neto + envio,
      faltaParaGratis: Math.max(0, ENVIO_GRATIS_DESDE - neto)
    };
  }

  function filtrarProductos(productos, f) {
    f = f || {};
    return productos.filter(function (p) {
      if (f.cat && p.categoria !== f.cat) return false;
      if (f.talles && f.talles.length) {
        var ok = p.talles.some(function (t) { return t.stock > 0 && f.talles.indexOf(t.talle) !== -1; });
        if (!ok) return false;
      }
      if (f.colores && f.colores.length) {
        var okc = p.colores.some(function (c) { return f.colores.indexOf(c.nombre) !== -1; });
        if (!okc) return false;
      }
      if (f.min != null && p.precio < f.min) return false;
      if (f.max != null && p.precio > f.max) return false;
      return true;
    });
  }

  function ordenarProductos(productos, orden) {
    var r = productos.slice();
    if (orden === 'precio-asc') r.sort(function (a, b) { return a.precio - b.precio; });
    else if (orden === 'precio-desc') r.sort(function (a, b) { return b.precio - a.precio; });
    else if (orden === 'nombre') r.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    return r;
  }

  function luhn(num) {
    var s = String(num).replace(/\D/g, '');
    var suma = 0;
    for (var i = 0; i < s.length; i++) {
      var d = Number(s[s.length - 1 - i]);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      suma += d;
    }
    return s.length > 0 && suma % 10 === 0;
  }

  function validarTarjeta(datos, hoy) {
    var errores = {};
    var num = String(datos.numero || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(num) || !luhn(num)) errores.numero = 'Número de tarjeta inválido';
    else if (num.indexOf('4242') !== 0) errores.numero = 'Esta es una demo: usá la tarjeta de prueba';

    var m = /^(\d{2})\/(\d{2})$/.exec(String(datos.venc || '').trim());
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
      errores.venc = 'Usá el formato MM/AA';
    } else {
      var anio = 2000 + Number(m[2]);
      var mes = Number(m[1]);
      var ya = hoy.getFullYear(), ma = hoy.getMonth() + 1;
      if (anio < ya || (anio === ya && mes < ma)) errores.venc = 'La tarjeta está vencida';
    }
    if (!/^\d{3}$/.test(String(datos.cvv || ''))) errores.cvv = 'El CVV tiene 3 dígitos';
    return { ok: Object.keys(errores).length === 0, errores: errores };
  }

  function cuotas(precio, n) {
    return Math.round(precio / (n || 3));
  }

  var Logica = {
    ENVIO_GRATIS_DESDE: ENVIO_GRATIS_DESDE,
    COSTO_ENVIO: COSTO_ENVIO,
    formatPrecio: formatPrecio,
    claveItem: claveItem,
    agregarItem: agregarItem,
    cambiarCantidad: cambiarCantidad,
    quitarItem: quitarItem,
    stockDe: stockDe,
    disponible: disponible,
    limpiarCarrito: limpiarCarrito,
    validarCupon: validarCupon,
    calcularTotales: calcularTotales,
    filtrarProductos: filtrarProductos,
    ordenarProductos: ordenarProductos,
    luhn: luhn,
    validarTarjeta: validarTarjeta,
    cuotas: cuotas
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Logica;
  else raiz.Logica = Logica;
})(this);
