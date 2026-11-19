/* NÓMADE — UI compartida: storage, barra demo, header, marquee, footer. */
var WEBNOVA_URL = 'https://presentaciones-web.netlify.app';

(function () {
  'use strict';

  var L = window.Logica;
  var memoria = {};

  /* ---------- Storage seguro ---------- */
  function leer(clave, porDefecto) {
    var v;
    try {
      v = window.localStorage.getItem(clave);
    } catch (e) {
      return clave in memoria ? memoria[clave] : porDefecto; // storage bloqueado
    }
    if (v == null) return porDefecto;
    try { return JSON.parse(v); } catch (e) { return porDefecto; } // dato corrupto
  }
  function guardar(clave, valor) {
    memoria[clave] = valor;
    try { window.localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* modo memoria */ }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Íconos ---------- */
  var P = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var ICONOS = {
    carrito: '<path d="M5 7h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    'corazon-lleno': '<path fill="currentColor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    buscar: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'flecha-izq': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    menos: '<path d="M6 12h12"/>',
    mas: '<path d="M12 6v12M6 12h12"/>',
    basura: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    camion: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    tarjeta: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3 10h18M7 15h4"/>',
    cambio: '<path d="M4 9h13l-3-3M20 15H7l3 3"/>',
    filtro: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    candado: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  function icono(nombre) {
    return '<svg viewBox="0 0 24 24" ' + P + ' aria-hidden="true" focusable="false">' + (ICONOS[nombre] || '') + '</svg>';
  }

  /* ---------- Estado ---------- */
  function producto(id) {
    for (var i = 0; i < PRODUCTOS.length; i++) if (PRODUCTOS[i].id === id) return PRODUCTOS[i];
    return undefined;
  }
  function getCarrito() { return L.limpiarCarrito(leer('nomade_carrito', []), PRODUCTOS); }
  function setCarrito(items) {
    guardar('nomade_carrito', items);
    actualizarBadges();
    document.dispatchEvent(new CustomEvent('carrito:cambio'));
  }
  function agregar(item) {
    var p = producto(item.id);
    var stock = L.stockDe(p, item.talle);
    setCarrito(L.agregarItem(getCarrito(), item, stock));
    var b = document.getElementById('badge-carrito');
    // Sin panel lateral: solo el contador del carrito rebota
    if (b) { b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); }
  }
  function getFavoritos() {
    var f = leer('nomade_favs', []);
    return Array.isArray(f) ? f.filter(function (id) { return !!producto(id); }) : [];
  }
  function toggleFavorito(id) {
    var f = getFavoritos();
    var i = f.indexOf(id);
    if (i === -1) f.push(id); else f.splice(i, 1);
    guardar('nomade_favs', f);
    actualizarBadges();
    document.dispatchEvent(new CustomEvent('favoritos:cambio'));
    return i === -1;
  }
  function getCupon() {
    var c = leer('nomade_cupon', null);
    return c && c.codigo ? L.validarCupon(c.codigo) : null;
  }
  function setCupon(c) { guardar('nomade_cupon', c); document.dispatchEvent(new CustomEvent('carrito:cambio')); }

  /* ---------- Tarjeta de producto ---------- */
  function tarjetaProducto(p) {
    var agotado = p.talles.every(function (t) { return t.stock === 0; });
    var st = '';
    if (p.nuevo) st += '<span class="sticker">Nuevo</span>';
    if (p.precioAnterior > p.precio) st += '<span class="sticker sticker--acento">-' + Math.round((1 - p.precio / p.precioAnterior) * 100) + '%</span>';
    if (agotado) st += '<span class="sticker sticker--claro">Agotado</span>';
    var fav = getFavoritos().indexOf(p.id) !== -1;
    var url = 'producto.html?id=' + encodeURIComponent(p.id);
    var cat = '';
    for (var i = 0; i < CATEGORIAS.length; i++) if (CATEGORIAS[i].id === p.categoria) cat = CATEGORIAS[i].nombre;
    return '' +
      '<article class="card">' +
        '<a class="card__media" href="' + url + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + p.imagenes[0] + '" alt="" loading="lazy" width="900" height="1125">' +
          (p.imagenes[1] ? '<img src="' + p.imagenes[1] + '" alt="" loading="lazy" width="900" height="1125">' : '') +
        '</a>' +
        (st ? '<div class="card__stickers">' + st + '</div>' : '') +
        '<button class="fav-btn" type="button" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Quitar de favoritos: ' : 'Agregar a favoritos: ') + esc(p.nombre) + '">' + icono(fav ? 'corazon-lleno' : 'corazon') + '</button>' +
        '<div class="card__info">' +
          '<div><h3 class="card__nombre"><a href="' + url + '">' + esc(p.nombre) + '</a></h3>' +
          '<p class="card__cat" style="margin:2px 0 0">' + cat + ' · ' + p.colores.length + (p.colores.length > 1 ? ' colores' : ' color') + '</p></div>' +
          '<p class="card__precio" style="margin:0"><span class="precio">' + L.formatPrecio(p.precio) + '</span>' +
            (p.precioAnterior > p.precio ? '<span class="precio-ant">' + L.formatPrecio(p.precioAnterior) + '</span>' : '') + '</p>' +
        '</div>' +
      '</article>';
  }

  // Delegación: botones de favorito en cualquier tarjeta
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-fav');
    var p = producto(id);
    var activo = toggleFavorito(id);
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', activo);
      b.setAttribute('aria-label', (activo ? 'Quitar de favoritos: ' : 'Agregar a favoritos: ') + (p ? p.nombre : ''));
      b.innerHTML = icono(activo ? 'corazon-lleno' : 'corazon') + (b.dataset.texto ? '<span>' + (activo ? 'En favoritos' : 'Guardar') + '</span>' : '');
    });
  });

  /* ---------- Layout compartido ---------- */
  var pagina = document.body.getAttribute('data-pagina') || '';

  function renderBarraDemo() {
    var el = document.getElementById('barra-demo');
    if (!el) return;
    el.className = 'barra-demo';
    el.innerHTML = 'Tienda demo creada por <a href="' + WEBNOVA_URL + '" target="_blank" rel="noopener">WebNova</a> — no se realizan ventas reales';
  }

  function linksNav() {
    return CATEGORIAS.map(function (c) {
      return '<a href="catalogo.html?cat=' + c.id + '">' + c.nombre + '</a>';
    }).join('') + '<a href="catalogo.html"' + (pagina === 'catalogo' ? ' aria-current="page"' : '') + '>Ver todo</a>';
  }

  function renderHeader() {
    var el = document.getElementById('header');
    if (!el) return;
    el.className = 'header';
    el.innerHTML =
      '<div class="wrap header__in">' +
        '<a class="logo" href="index.html" aria-label="NÓMADE, ir al inicio">Nómade<i></i></a>' +
        '<nav class="nav" aria-label="Principal">' + linksNav() + '</nav>' +
        '<div class="acciones">' +
          '<a class="icono-btn" href="catalogo.html" aria-label="Buscar en el catálogo">' + icono('buscar') + '</a>' +
          '<a class="icono-btn" href="favoritos.html" aria-label="Favoritos">' + icono('corazon') + '<span class="badge" id="badge-favs" hidden></span></a>' +
          '<a class="icono-btn" href="carrito.html" id="ver-carrito" aria-label="Ver carrito"' + (pagina === 'carrito' ? ' aria-current="page"' : '') + '>' + icono('carrito') + '<span class="badge" id="badge-carrito" hidden></span></a>' +
          '<button class="icono-btn menu-btn" type="button" id="abrir-menu" aria-label="Abrir menú" aria-controls="menu-mobile" aria-expanded="false">' + icono('menu') + '</button>' +
        '</div>' +
      '</div>';

    var menu = document.createElement('div');
    menu.className = 'menu-mobile';
    menu.id = 'menu-mobile';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Menú');
    menu.innerHTML =
      '<div class="menu-mobile__top"><span class="logo">Nómade<i></i></span>' +
      '<button class="icono-btn" type="button" id="cerrar-menu" aria-label="Cerrar menú">' + icono('cerrar') + '</button></div>' +
      '<nav aria-label="Menú mobile">' + linksNav() + '<a href="favoritos.html">Favoritos</a><a href="carrito.html">Carrito</a></nav>';
    document.body.appendChild(menu);

    var abrir = document.getElementById('abrir-menu');
    function setMenu(abierto) {
      menu.classList.toggle('abierto', abierto);
      abrir.setAttribute('aria-expanded', abierto);
      abrir.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = abierto ? 'hidden' : '';
      if (abierto) document.getElementById('cerrar-menu').focus(); else abrir.focus();
    }
    abrir.addEventListener('click', function () { setMenu(true); });
    document.getElementById('cerrar-menu').addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('abierto')) setMenu(false); });

  }

  function renderMarquee() {
    var el = document.getElementById('marquee');
    if (!el) return;
    var frases = ['Envío gratis desde ' + L.formatPrecio(L.ENVIO_GRATIS_DESDE), 'Nueva temporada', '3 cuotas sin interés', 'Cambios gratis por 30 días', 'Drop 07 ya disponible'];
    var txt = frases.map(function (f) { return '<span>' + f + '</span>'; }).join('');
    el.className = 'marquee';
    el.setAttribute('aria-label', frases.join(' · '));
    el.innerHTML = '<div class="marquee__track" aria-hidden="true">' + txt + txt + txt + txt + '</div>';
  }

  function renderFooter() {
    var el = document.getElementById('footer');
    if (!el) return;
    el.className = 'footer';
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="footer__grid">' +
          '<div class="footer__news"><h3>Drops antes que nadie</h3>' +
            '<p>Avisamos cada lanzamiento por mail, una vez por mes como mucho.</p>' +
            '<form class="footer__form" id="form-news" novalidate>' +
              '<label class="visually-hidden" for="news-email">Tu email</label>' +
              '<input id="news-email" type="email" placeholder="tu@email.com" autocomplete="email" required>' +
              '<button class="btn" type="submit">Sumarme</button>' +
            '</form><p class="footer__msg" id="news-msg" role="status"></p></div>' +
          '<div><h3>Tienda</h3><ul>' + CATEGORIAS.map(function (c) { return '<li><a href="catalogo.html?cat=' + c.id + '">' + c.nombre + '</a></li>'; }).join('') + '</ul></div>' +
          '<div><h3>Ayuda</h3><ul><li><a href="carrito.html">Mi carrito</a></li><li><a href="favoritos.html">Favoritos</a></li><li><a href="catalogo.html?orden=precio-asc">Ofertas</a></li></ul></div>' +
          '<div><h3>Local</h3><ul><li>Palermo Soho, CABA</li><li>Lun a sáb · 11 a 20 h</li><li><a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a></li></ul></div>' +
        '</div>' +
        '<p class="footer__marca" aria-hidden="true">Nómade<span>.</span></p>' +
        '<div class="footer__legal"><span>© 2026 NÓMADE — marca ficticia, tienda de demostración.</span>' +
        '<span>Fotos: Unsplash · Sitio por <a href="' + WEBNOVA_URL + '" target="_blank" rel="noopener" style="text-decoration:underline">WebNova</a></span></div>' +
      '</div>';

    var form = document.getElementById('form-news');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('news-email');
      var msg = document.getElementById('news-msg');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        msg.textContent = 'Revisá el email, parece que falta algo.';
        input.focus();
        return;
      }
      msg.textContent = 'Listo, quedaste anotado (es una demo: no enviamos mails).';
      form.reset();
    });
  }

  /* ---------- Overlay compartido (panel de filtros del catálogo) ---------- */
  function crearOverlay() {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'overlay';
    document.body.appendChild(ov);
  }

  function barraEnvio(t) {
    var pct = Math.min(100, Math.round((1 - t.faltaParaGratis / L.ENVIO_GRATIS_DESDE) * 100));
    var txt = t.faltaParaGratis > 0
      ? 'Te faltan <b>' + L.formatPrecio(t.faltaParaGratis) + '</b> para el envío gratis'
      : '<b>¡Tenés envío gratis!</b>';
    return '<div class="envio-bar"><span>' + txt + '</span><div class="envio-bar__track"><div class="envio-bar__fill" style="width:' + pct + '%"></div></div></div>';
  }

  function actualizarBadges() {
    var bc = document.getElementById('badge-carrito');
    if (bc) {
      var n = getCarrito().reduce(function (s, i) { return s + i.cantidad; }, 0);
      bc.textContent = n;
      bc.hidden = n === 0;
      document.getElementById('ver-carrito').setAttribute('aria-label', 'Ver carrito, ' + n + (n === 1 ? ' producto' : ' productos'));
    }
    var bf = document.getElementById('badge-favs');
    if (bf) {
      var f = getFavoritos().length;
      bf.textContent = f;
      bf.hidden = f === 0;
    }
  }

  // Si otra pestaña cambia el carrito, sincronizar
  window.addEventListener('storage', function (e) {
    if (e.key === 'nomade_carrito' || e.key === 'nomade_favs') {
      actualizarBadges();
      document.dispatchEvent(new CustomEvent(e.key === 'nomade_favs' ? 'favoritos:cambio' : 'carrito:cambio'));
    }
  });

  /* ---------- Foco atrapado en paneles modales (menú, filtros) ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var panel = document.querySelector('.drawer.abierto, .menu-mobile.abierto, .filtros.abierto');
    if (!panel) return;
    var foco = Array.prototype.filter.call(
      panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
    if (!foco.length) return;
    var primero = foco[0], ultimo = foco[foco.length - 1];
    if (!panel.contains(document.activeElement)) { e.preventDefault(); primero.focus(); }
    else if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  /* ---------- Init ---------- */
  renderBarraDemo();
  renderHeader();
  renderMarquee();
  renderFooter();
  crearOverlay();
  actualizarBadges();

  window.Tienda = {
    esc: esc,
    icono: icono,
    producto: producto,
    getCarrito: getCarrito,
    setCarrito: setCarrito,
    agregar: agregar,
    getFavoritos: getFavoritos,
    toggleFavorito: toggleFavorito,
    getCupon: getCupon,
    setCupon: setCupon,
    tarjetaProducto: tarjetaProducto,
    barraEnvio: barraEnvio
  };
})();
