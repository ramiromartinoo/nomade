/* NÓMADE — Página de carrito */
(function () {
  'use strict';
  var T = window.Tienda, L = window.Logica, esc = T.esc;
  var cont = document.getElementById('carrito');
  var errorCupon = '';

  function filas(t) {
    var cupon = T.getCupon();
    return '<dl class="resumen__filas">' +
      '<div><dt>Subtotal</dt><dd>' + L.formatPrecio(t.subtotal) + '</dd></div>' +
      (t.descuento ? '<div class="descuento"><dt>Descuento' + (cupon ? ' (' + cupon.codigo + ')' : '') + '</dt><dd>−' + L.formatPrecio(t.descuento) + '</dd></div>' : '') +
      '<div><dt>Envío a domicilio</dt><dd>' + (t.envio ? L.formatPrecio(t.envio) : 'Gratis') + '</dd></div>' +
      '</dl>';
  }

  function render() {
    var c = T.getCarrito();
    var n = c.reduce(function (s, i) { return s + i.cantidad; }, 0);
    document.getElementById('sub-carrito').textContent = n ? n + (n === 1 ? ' producto' : ' productos') : '';

    if (!c.length) {
      cont.innerHTML = '<div class="vacio" style="padding:96px 0 140px"><p style="font-size:18px">Tu carrito está vacío.</p>' +
        '<a class="btn btn--acento" href="catalogo.html">Ver productos</a></div>';
      return;
    }

    var cupon = T.getCupon();
    var t = L.calcularTotales(c, PRODUCTOS, cupon, 'domicilio');

    var items = c.map(function (i) {
      var p = T.producto(i.id);
      var clave = L.claveItem(i);
      var stock = L.disponible(c, p, i.talle, clave); // máximo para esta línea
      var url = 'producto.html?id=' + encodeURIComponent(p.id);
      return '<li class="item" data-clave="' + esc(clave) + '">' +
        '<a href="' + url + '" tabindex="-1" aria-hidden="true"><img src="' + p.imagenes[0] + '" alt="" width="112" height="140"></a>' +
        '<div><h2 class="item__nombre"><a href="' + url + '">' + esc(p.nombre) + '</a></h2>' +
          '<p class="item__meta">' + esc(i.color) + ' · Talle ' + esc(i.talle) + (i.cantidad >= stock ? ' · <span style="color:var(--accent)">Máximo disponible</span>' : '') + '</p>' +
          '<div class="item__acciones">' +
            '<div class="cantidad" role="group" aria-label="Cantidad de ' + esc(p.nombre) + '">' +
              '<button type="button" data-accion="menos" aria-label="Restar uno"' + (i.cantidad <= 1 ? ' disabled' : '') + '>' + T.icono('menos') + '</button>' +
              '<output aria-live="polite">' + i.cantidad + '</output>' +
              '<button type="button" data-accion="mas" aria-label="Sumar uno"' + (i.cantidad >= stock ? ' disabled' : '') + '>' + T.icono('mas') + '</button></div>' +
            '<button class="item__quitar" type="button" data-accion="quitar" aria-label="Quitar ' + esc(p.nombre) + ' del carrito">' + T.icono('basura') + 'Quitar</button>' +
          '</div></div>' +
        '<p class="item__precio" style="margin:0">' + L.formatPrecio(p.precio * i.cantidad) +
          (i.cantidad > 1 ? '<span class="item__unit">' + L.formatPrecio(p.precio) + ' c/u</span>' : '') + '</p>' +
        '</li>';
    }).join('');

    var bloqueCupon = cupon
      ? '<div class="cupon-activo"><span>Cupón <b>' + cupon.codigo + '</b> aplicado</span><button type="button" id="quitar-cupon">Quitar</button></div>'
      : '<form class="campo" id="form-cupon" novalidate><label for="cupon">¿Tenés un cupón?</label>' +
          '<div class="cupon"><input class="input" id="cupon" autocomplete="off" placeholder="Código"' + (errorCupon ? ' aria-invalid="true" aria-describedby="cupon-error"' : '') + '>' +
          '<button class="btn" type="submit">Aplicar</button></div>' +
          (errorCupon ? '<p class="error-campo" id="cupon-error" role="alert">' + errorCupon + '</p>' : '') +
          '<p class="cupon-pista">Para probar: <code>NOMADE10</code> o <code>BIENVENIDA</code></p></form>';

    cont.innerHTML = '<div class="carrito">' +
      '<ul class="items" style="list-style:none;margin:0;padding:0">' + items + '</ul>' +
      '<aside class="resumen" aria-labelledby="resumen-titulo">' +
        '<h2 id="resumen-titulo">Resumen</h2>' +
        T.barraEnvio(t) + bloqueCupon + filas(t) +
        '<div class="resumen__total"><span>Total</span><span>' + L.formatPrecio(t.total) + '</span></div>' +
        '<a class="btn btn--acento btn--bloque" href="checkout.html">Finalizar compra ' + T.icono('flecha') + '</a>' +
        '<a class="link" href="catalogo.html" style="justify-self:center">Seguir comprando</a>' +
        '<p class="seguro" style="margin:0">' + T.icono('candado') + 'Compra de demostración: no se cobra nada</p>' +
      '</aside></div>';

    var form = document.getElementById('form-cupon');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = document.getElementById('cupon').value;
      var cup = L.validarCupon(v);
      if (!v.trim()) { errorCupon = 'Escribí un código.'; }
      else if (!cup) { errorCupon = 'Cupón inválido. Revisá que esté bien escrito.'; }
      else { errorCupon = ''; T.setCupon(cup); return; }
      render();
      document.getElementById('cupon').focus();
    });
    var quitar = document.getElementById('quitar-cupon');
    if (quitar) quitar.addEventListener('click', function () { T.setCupon(null); });
  }

  cont.addEventListener('click', function (e) {
    var b = e.target.closest('[data-accion]');
    if (!b || b.disabled) return;
    var li = b.closest('[data-clave]');
    var clave = li.getAttribute('data-clave');
    var c = T.getCarrito();
    var it = c.filter(function (i) { return L.claveItem(i) === clave; })[0];
    if (!it) return;
    var stock = L.stockDe(T.producto(it.id), it.talle);
    var accion = b.getAttribute('data-accion');
    if (accion === 'quitar') c = L.quitarItem(c, clave);
    else c = L.cambiarCantidad(c, clave, it.cantidad + (accion === 'mas' ? 1 : -1), stock);
    T.setCarrito(c);
    // devolver el foco al mismo control tras re-render
    var nuevo = cont.querySelector('[data-clave="' + CSS.escape(clave) + '"] [data-accion="' + accion + '"]');
    if (nuevo && !nuevo.disabled) nuevo.focus();
    else { var otro = cont.querySelector('[data-clave="' + CSS.escape(clave) + '"] .cantidad button:not([disabled])') || cont.querySelector('a, button'); if (otro) otro.focus(); }
  });

  document.addEventListener('carrito:cambio', render);
  render();
})();
