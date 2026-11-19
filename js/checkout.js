/* NÓMADE — Checkout en 3 pasos con pago simulado (demo: no se cobra ni se guarda la tarjeta) */
(function () {
  'use strict';
  var T = window.Tienda, L = window.Logica, esc = T.esc;
  var cont = document.getElementById('checkout');
  var TARJETA_PRUEBA = { numero: '4242 4242 4242 4242', venc: '12/30', cvv: '123' };
  var LOCAL = 'Gurruchaga y Honduras, Palermo Soho';

  var datos = { nombre: '', email: '', telefono: '', envio: 'domicilio', direccion: '', ciudad: '', cp: '', titular: '', numero: '', venc: '', cvv: '' };
  var paso = 1;

  /* ---------- Pedido ya confirmado (recarga de la página de éxito) ---------- */
  function leerPedido() {
    try { return JSON.parse(sessionStorage.getItem('nomade_pedido') || 'null'); } catch (e) { return null; }
  }
  var q = new URLSearchParams(location.search).get('pedido');
  var guardado = leerPedido();
  if (q && guardado && guardado.num === q) { renderExito(guardado); return; }
  if (q) history.replaceState(null, '', location.pathname);

  if (!T.getCarrito().length) {
    cont.innerHTML = '<div class="vacio" style="padding:120px 0 160px"><h1 style="font-size:clamp(44px,7vw,88px)">Tu carrito está vacío</h1>' +
      '<p>Agregá algo antes de finalizar la compra.</p><a class="btn btn--acento" href="catalogo.html">Ver productos</a></div>';
    return;
  }

  /* ---------- Validación ---------- */
  var REGLAS = {
    nombre: function (v) { return v.trim().length >= 3 ? '' : 'Escribí tu nombre y apellido.'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Revisá el email, parece incompleto.'; },
    telefono: function (v) { return v.replace(/\D/g, '').length >= 8 ? '' : 'Escribí un teléfono con código de área.'; },
    direccion: function (v) { return v.trim().length >= 4 ? '' : 'Escribí calle y altura.'; },
    ciudad: function (v) { return v.trim().length >= 2 ? '' : 'Escribí tu ciudad.'; },
    cp: function (v) { return /^[A-Za-z]?\d{4}[A-Za-z]{0,3}$/.test(v.trim()) ? '' : 'El código postal tiene 4 números (ej. 1414).'; },
    titular: function (v) { return v.trim().length >= 3 ? '' : 'Escribí el nombre como figura en la tarjeta.'; }
  };

  function campo(id, label, opts) {
    opts = opts || {};
    return '<div class="campo' + (opts.ancho ? ' ancho' : '') + '"><label for="' + id + '">' + label + '</label>' +
      '<input class="input" id="' + id + '" name="' + id + '" value="' + esc(datos[id]) + '"' +
      (opts.type ? ' type="' + opts.type + '"' : ' type="text"') +
      (opts.auto ? ' autocomplete="' + opts.auto + '"' : '') +
      (opts.modo ? ' inputmode="' + opts.modo + '"' : '') +
      (opts.max ? ' maxlength="' + opts.max + '"' : '') +
      (opts.ph ? ' placeholder="' + opts.ph + '"' : '') +
      ' aria-describedby="' + id + '-error" required>' +
      '<p class="error-campo" id="' + id + '-error"></p></div>';
  }

  function marcarError(id, msg) {
    var input = document.getElementById(id);
    var p = document.getElementById(id + '-error');
    if (!input) return;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    p.textContent = msg || '';
  }

  function validarCampos(ids) {
    var primero = null;
    ids.forEach(function (id) {
      var input = document.getElementById(id);
      datos[id] = input.value;
      var msg = REGLAS[id](input.value);
      marcarError(id, msg);
      if (msg && !primero) primero = input;
    });
    if (primero) primero.focus();
    return !primero;
  }

  /* ---------- Resumen ---------- */
  function totales() { return L.calcularTotales(T.getCarrito(), PRODUCTOS, T.getCupon(), datos.envio); }
  function renderResumen() {
    var c = T.getCarrito();
    var t = totales();
    var cupon = T.getCupon();
    var el = document.getElementById('resumen');
    var cerrado = el.classList.contains('cerrado');
    el.innerHTML =
      '<button class="resumen-toggle" type="button" id="resumen-toggle" aria-expanded="' + !cerrado + '" aria-controls="resumen-cuerpo">' +
        '<span>Ver resumen · ' + L.formatPrecio(t.total) + '</span>' + T.icono('flecha') + '</button>' +
      '<h2>Tu pedido</h2>' +
      '<div class="resumen__cuerpo" id="resumen-cuerpo">' +
        '<div class="resumen-items">' + c.map(function (i) {
          var p = T.producto(i.id);
          return '<div class="resumen-item"><img src="' + p.imagenes[0] + '" alt="" width="56" height="70">' +
            '<div><b>' + esc(p.nombre) + '</b><span>' + esc(i.color) + ' · ' + esc(i.talle) + ' · x' + i.cantidad + '</span></div>' +
            '<b>' + L.formatPrecio(p.precio * i.cantidad) + '</b></div>';
        }).join('') + '</div>' +
        '<dl class="resumen__filas">' +
          '<div><dt>Subtotal</dt><dd>' + L.formatPrecio(t.subtotal) + '</dd></div>' +
          (t.descuento ? '<div class="descuento"><dt>Descuento' + (cupon ? ' (' + cupon.codigo + ')' : '') + '</dt><dd>−' + L.formatPrecio(t.descuento) + '</dd></div>' : '') +
          '<div><dt>' + (datos.envio === 'retiro' ? 'Retiro en el local' : 'Envío a domicilio') + '</dt><dd>' + (t.envio ? L.formatPrecio(t.envio) : 'Gratis') + '</dd></div>' +
        '</dl>' +
        '<div class="resumen__total"><span>Total</span><span>' + L.formatPrecio(t.total) + '</span></div>' +
        '<a class="link" href="carrito.html" style="justify-self:start">Editar carrito</a>' +
      '</div>';
    document.getElementById('resumen-toggle').addEventListener('click', function () {
      var abierto = el.classList.toggle('cerrado') === false;
      this.setAttribute('aria-expanded', abierto);
    });
  }

  /* ---------- Pasos ---------- */
  function indicador() {
    var nombres = ['Datos', 'Envío', 'Pago'];
    return '<ol class="pasos" aria-label="Pasos de la compra">' + nombres.map(function (n, i) {
      var num = i + 1;
      return '<li' + (num === paso ? ' aria-current="step"' : '') + (num < paso ? ' class="hecho"' : '') + '><b>' + (num < paso ? T.icono('check') : num) + '</b>' + n + '</li>';
    }).join('') + '</ol>';
  }

  function htmlPaso() {
    if (paso === 1) {
      return '<form class="paso" id="form-paso" novalidate><h2 tabindex="-1">Tus datos</h2>' +
        '<div class="grid-campos">' +
          campo('nombre', 'Nombre y apellido', { auto: 'name', ancho: true }) +
          campo('email', 'Email', { type: 'email', auto: 'email', ph: 'tu@email.com' }) +
          campo('telefono', 'Teléfono', { type: 'tel', auto: 'tel', modo: 'tel', ph: '11 2345 6789' }) +
        '</div>' +
        '<div class="paso__nav"><a class="btn-volver" href="carrito.html">' + T.icono('flecha-izq') + 'Volver al carrito</a>' +
        '<button class="btn btn--acento" type="submit">Continuar al envío ' + T.icono('flecha') + '</button></div></form>';
    }
    if (paso === 2) {
      var t = L.calcularTotales(T.getCarrito(), PRODUCTOS, T.getCupon(), 'domicilio');
      return '<form class="paso" id="form-paso" novalidate><h2 tabindex="-1">Envío</h2>' +
        '<fieldset style="border:0;margin:0;padding:0"><legend class="visually-hidden">Cómo querés recibir tu pedido</legend><div class="opciones-envio">' +
          '<label class="op-envio"><input type="radio" name="envio" value="domicilio"' + (datos.envio === 'domicilio' ? ' checked' : '') + '>' +
            '<div><b>Envío a domicilio</b><span>Llega en 3 a 6 días hábiles</span></div><strong>' + (t.envio ? L.formatPrecio(t.envio) : 'Gratis') + '</strong></label>' +
          '<label class="op-envio"><input type="radio" name="envio" value="retiro"' + (datos.envio === 'retiro' ? ' checked' : '') + '>' +
            '<div><b>Retiro en el local</b><span>' + LOCAL + ' · listo en 24 h</span></div><strong>Gratis</strong></label>' +
        '</div></fieldset>' +
        '<div class="grid-campos" id="campos-dir"' + (datos.envio === 'retiro' ? ' hidden' : '') + '>' +
          campo('direccion', 'Calle y altura', { auto: 'street-address', ancho: true }) +
          campo('ciudad', 'Ciudad', { auto: 'address-level2' }) +
          campo('cp', 'Código postal', { auto: 'postal-code', max: 8, ph: '1414' }) +
        '</div>' +
        '<div class="paso__nav"><button class="btn-volver" type="button" data-volver>' + T.icono('flecha-izq') + 'Volver a tus datos</button>' +
        '<button class="btn btn--acento" type="submit">Continuar al pago ' + T.icono('flecha') + '</button></div></form>';
    }
    return '<form class="paso" id="form-paso" novalidate><h2 tabindex="-1">Pago</h2>' +
      '<div class="aviso-demo">' + T.icono('candado') + '<p><b>Demo: no se realiza ningún cobro.</b> Solo funciona la tarjeta de prueba, no cargues una tarjeta real. Nada de lo que escribas acá se guarda.</p></div>' +
      '<button class="btn btn--borde" type="button" id="usar-prueba" style="justify-self:start">' + T.icono('tarjeta') + 'Usar tarjeta de prueba</button>' +
      '<div class="grid-campos">' +
        campo('numero', 'Número de tarjeta', { modo: 'numeric', ancho: true, max: 19, ph: '4242 4242 4242 4242', auto: 'off' }) +
        campo('titular', 'Nombre en la tarjeta', { ancho: true, auto: 'off' }) +
        campo('venc', 'Vencimiento', { modo: 'numeric', max: 5, ph: 'MM/AA', auto: 'off' }) +
        campo('cvv', 'CVV', { modo: 'numeric', max: 3, ph: '123', auto: 'off' }) +
      '</div>' +
      '<div class="paso__nav"><button class="btn-volver" type="button" data-volver>' + T.icono('flecha-izq') + 'Volver al envío</button>' +
      '<button class="btn btn--acento" type="submit" id="pagar">Pagar ' + L.formatPrecio(totales().total) + '</button></div></form>';
  }

  function renderPaso(enfocar) {
    document.getElementById('pasos').innerHTML = indicador() + htmlPaso();
    var form = document.getElementById('form-paso');
    form.addEventListener('submit', enviar);
    var volver = form.querySelector('[data-volver]');
    if (volver) volver.addEventListener('click', function () { guardarVisibles(); paso--; renderPaso(true); });

    if (paso === 2) {
      form.querySelectorAll('input[name="envio"]').forEach(function (r) {
        r.addEventListener('change', function () {
          datos.envio = r.value;
          document.getElementById('campos-dir').hidden = datos.envio === 'retiro';
          renderResumen();
        });
      });
    }
    if (paso === 3) {
      var num = document.getElementById('numero');
      num.addEventListener('input', function () {
        var d = num.value.replace(/\D/g, '').slice(0, 16);
        num.value = d.replace(/(\d{4})(?=\d)/g, '$1 ');
      });
      var venc = document.getElementById('venc');
      venc.addEventListener('input', function (e) {
        var d = venc.value.replace(/\D/g, '').slice(0, 4);
        venc.value = d.length > 2 || (d.length === 2 && e.inputType !== 'deleteContentBackward') ? d.slice(0, 2) + '/' + d.slice(2) : d;
      });
      var cvv = document.getElementById('cvv');
      cvv.addEventListener('input', function () { cvv.value = cvv.value.replace(/\D/g, '').slice(0, 3); });
      document.getElementById('usar-prueba').addEventListener('click', function () {
        num.value = TARJETA_PRUEBA.numero;
        venc.value = TARJETA_PRUEBA.venc;
        cvv.value = TARJETA_PRUEBA.cvv;
        var tit = document.getElementById('titular');
        if (!tit.value.trim()) tit.value = datos.nombre;
        ['numero', 'venc', 'cvv', 'titular'].forEach(function (id) { marcarError(id, ''); });
      });
    }
    if (enfocar) {
      form.querySelector('h2').focus({ preventScroll: true });
      cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function guardarVisibles() {
    ['nombre', 'email', 'telefono', 'direccion', 'ciudad', 'cp'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) datos[id] = el.value;
    });
  }

  function enviar(e) {
    e.preventDefault();
    if (paso === 1) {
      if (!validarCampos(['nombre', 'email', 'telefono'])) return;
      paso = 2; renderPaso(true); return;
    }
    if (paso === 2) {
      if (datos.envio === 'domicilio' && !validarCampos(['direccion', 'ciudad', 'cp'])) return;
      paso = 3; renderPaso(true); return;
    }
    // Paso 3: pago simulado
    var okTitular = validarCampos(['titular']);
    var r = L.validarTarjeta({
      numero: document.getElementById('numero').value,
      venc: document.getElementById('venc').value,
      cvv: document.getElementById('cvv').value
    }, new Date());
    ['numero', 'venc', 'cvv'].forEach(function (id) { marcarError(id, r.errores[id]); });
    if (!r.ok) {
      var primero = ['numero', 'venc', 'cvv'].filter(function (id) { return r.errores[id]; })[0];
      document.getElementById(primero).focus();
      return;
    }
    if (!okTitular) return;

    var btn = document.getElementById('pagar');
    btn.disabled = true;
    btn.textContent = 'Procesando…';
    setTimeout(confirmar, 1100);
  }

  function confirmar() {
    var t = totales();
    var pedido = {
      num: 'NMD-' + String(Math.floor(100000 + Math.random() * 900000)),
      total: t.total,
      email: datos.email.trim(),
      envio: datos.envio,
      items: T.getCarrito().reduce(function (s, i) { return s + i.cantidad; }, 0)
    };
    try { sessionStorage.setItem('nomade_pedido', JSON.stringify(pedido)); } catch (e) { /* sin storage: igual mostramos el éxito */ }
    confirmado = true;
    T.setCarrito([]);
    T.setCupon(null);
    history.replaceState(null, '', location.pathname + '?pedido=' + pedido.num);
    renderExito(pedido);
  }

  function renderExito(p) {
    document.title = 'Pedido confirmado — NÓMADE';
    cont.innerHTML = '<div class="exito" role="status">' +
      '<div class="exito__check">' + T.icono('check') + '</div>' +
      '<p class="exito__num">Pedido ' + esc(p.num) + '</p>' +
      '<h1 tabindex="-1" id="exito-titulo">¡Gracias por tu compra!</h1>' +
      '<p>' + (p.items === 1 ? '1 producto' : esc(p.items) + ' productos') + ' por ' + L.formatPrecio(p.total) + '. ' +
        (p.envio === 'retiro' ? 'Te avisamos cuando esté listo para retirar en ' + LOCAL + '.' : 'Te mandamos el seguimiento del envío a ' + esc(p.email) + '.') + '</p>' +
      '<p style="font-size:13px;color:var(--muted)">Recordá que es una tienda de demostración: no se cobró nada ni se envió ningún mail.</p>' +
      '<a class="btn btn--acento" href="catalogo.html">Seguir comprando</a></div>';
    var h = document.getElementById('exito-titulo');
    if (h) h.focus({ preventScroll: true });
  }

  /* ---------- Montaje ---------- */
  cont.innerHTML = '<div class="checkout"><div id="pasos"></div><aside class="resumen cerrado" id="resumen" aria-label="Resumen del pedido"></aside></div>';
  if (window.matchMedia('(min-width: 961px)').matches) document.getElementById('resumen').classList.remove('cerrado');
  renderResumen();
  renderPaso(false);
  var confirmado = false;
  document.addEventListener('carrito:cambio', function () {
    if (confirmado) return;
    if (!T.getCarrito().length) location.reload();
    else if (document.getElementById('resumen')) renderResumen();
  });
})();
