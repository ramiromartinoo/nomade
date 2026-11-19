/* NÓMADE — Catálogo: filtros, orden y estado en la URL */
(function () {
  'use strict';
  var T = window.Tienda, L = window.Logica;

  var TALLES = ['S', 'M', 'L', 'XL', 'XXL'];
  var ORDENES = ['relevancia', 'precio-asc', 'precio-desc', 'nombre'];
  var COLORES = [];
  PRODUCTOS.forEach(function (p) {
    p.colores.forEach(function (c) {
      if (!COLORES.some(function (x) { return x.nombre === c.nombre; })) COLORES.push(c);
    });
  });
  var catIds = CATEGORIAS.map(function (c) { return c.id; });
  var colorNombres = COLORES.map(function (c) { return c.nombre; });

  /* ---------- Estado <-> URL ---------- */
  function lista(v, validos) {
    return (v || '').split(',').filter(function (x) { return validos.indexOf(x) !== -1; });
  }
  function numero(v) {
    var n = parseInt(v, 10);
    return isNaN(n) || n < 0 ? null : n;
  }
  function leerURL() {
    var q = new URLSearchParams(location.search);
    return {
      cat: catIds.indexOf(q.get('cat')) !== -1 ? q.get('cat') : '',
      talles: lista(q.get('talle'), TALLES),
      colores: lista(q.get('color'), colorNombres),
      min: numero(q.get('min')),
      max: numero(q.get('max')),
      orden: ORDENES.indexOf(q.get('orden')) !== -1 ? q.get('orden') : 'relevancia'
    };
  }
  var estado = leerURL();

  function escribirURL() {
    var q = new URLSearchParams();
    if (estado.cat) q.set('cat', estado.cat);
    if (estado.talles.length) q.set('talle', estado.talles.join(','));
    if (estado.colores.length) q.set('color', estado.colores.join(','));
    if (estado.min != null) q.set('min', estado.min);
    if (estado.max != null) q.set('max', estado.max);
    if (estado.orden !== 'relevancia') q.set('orden', estado.orden);
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  /* ---------- Controles ---------- */
  var elCats = document.getElementById('f-cats');
  var elTalles = document.getElementById('f-talles');
  var elColores = document.getElementById('f-colores');
  var elMin = document.getElementById('f-min');
  var elMax = document.getElementById('f-max');
  var elOrden = document.getElementById('orden');

  function contarCat(id) {
    return PRODUCTOS.filter(function (p) { return !id || p.categoria === id; }).length;
  }
  function renderControles() {
    elCats.innerHTML = [{ id: '', nombre: 'Todo' }].concat(CATEGORIAS).map(function (c) {
      var sel = estado.cat === c.id;
      return '<button type="button" role="radio" data-cat="' + c.id + '" aria-checked="' + sel + '" tabindex="' + (sel ? 0 : -1) + '">' + c.nombre + ' <span>' + contarCat(c.id) + '</span></button>';
    }).join('');
    elTalles.innerHTML = TALLES.map(function (t) {
      return '<button class="chip" type="button" data-talle="' + t + '" aria-pressed="' + (estado.talles.indexOf(t) !== -1) + '">' + t + '</button>';
    }).join('');
    elColores.innerHTML = COLORES.map(function (c) {
      return '<button class="chip" type="button" data-color="' + c.nombre + '" aria-pressed="' + (estado.colores.indexOf(c.nombre) !== -1) + '"><i style="background:' + c.hex + '"></i>' + c.nombre + '</button>';
    }).join('');
    elMin.value = estado.min == null ? '' : estado.min;
    elMax.value = estado.max == null ? '' : estado.max;
    elOrden.value = estado.orden;
  }

  function toggle(arr, v) {
    var i = arr.indexOf(v);
    if (i === -1) arr.push(v); else arr.splice(i, 1);
  }
  function refocus(cont, attr, val) {
    var b = cont.querySelector('[' + attr + '="' + val + '"]');
    if (b) b.focus();
  }

  elCats.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    estado.cat = b.getAttribute('data-cat');
    actualizar();
    refocus(elCats, 'data-cat', estado.cat);
  });
  elCats.addEventListener('keydown', function (e) {
    if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].indexOf(e.key) === -1) return;
    e.preventDefault();
    var ids = [''].concat(catIds);
    var i = ids.indexOf(estado.cat) + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1);
    estado.cat = ids[(i + ids.length) % ids.length];
    actualizar();
    refocus(elCats, 'data-cat', estado.cat);
  });
  elTalles.addEventListener('click', function (e) {
    var b = e.target.closest('[data-talle]');
    if (!b) return;
    var v = b.getAttribute('data-talle');
    toggle(estado.talles, v); actualizar(); refocus(elTalles, 'data-talle', v);
  });
  elColores.addEventListener('click', function (e) {
    var b = e.target.closest('[data-color]');
    if (!b) return;
    var v = b.getAttribute('data-color');
    toggle(estado.colores, v); actualizar(); refocus(elColores, 'data-color', v);
  });
  function leerPrecio() {
    estado.min = numero(elMin.value);
    estado.max = numero(elMax.value);
    actualizar(true);
  }
  elMin.addEventListener('change', leerPrecio);
  elMax.addEventListener('change', leerPrecio);
  elOrden.addEventListener('change', function () { estado.orden = elOrden.value; actualizar(true); });
  document.getElementById('limpiar').addEventListener('click', function () {
    estado = { cat: '', talles: [], colores: [], min: null, max: null, orden: estado.orden };
    actualizar();
  });

  /* ---------- Panel de filtros en mobile ---------- */
  var panel = document.getElementById('filtros');
  var abrirF = document.getElementById('abrir-filtros');
  var overlay = document.getElementById('overlay');
  document.getElementById('cerrar-filtros').innerHTML = T.icono('cerrar');
  function setPanel(abierto) {
    panel.classList.toggle('abierto', abierto);
    overlay.classList.toggle('visible', abierto);
    abrirF.setAttribute('aria-expanded', abierto);
    document.body.style.overflow = abierto ? 'hidden' : '';
    if (abierto) document.getElementById('cerrar-filtros').focus(); else abrirF.focus();
  }
  abrirF.addEventListener('click', function () { setPanel(true); });
  document.getElementById('cerrar-filtros').addEventListener('click', function () { setPanel(false); });
  document.getElementById('ver-res').addEventListener('click', function () { setPanel(false); });
  overlay.addEventListener('click', function () { if (panel.classList.contains('abierto')) setPanel(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('abierto')) setPanel(false); });

  /* ---------- Resultados ---------- */
  function cantidadFiltros() {
    return (estado.cat ? 1 : 0) + estado.talles.length + estado.colores.length + (estado.min != null ? 1 : 0) + (estado.max != null ? 1 : 0);
  }
  function renderResultados() {
    var res = L.ordenarProductos(L.filtrarProductos(PRODUCTOS, estado), estado.orden);
    var grilla = document.getElementById('grilla');
    document.getElementById('contador').textContent = res.length + (res.length === 1 ? ' producto' : ' productos');
    if (!res.length) {
      grilla.innerHTML = '<div class="vacio" style="grid-column:1/-1"><p>No hay productos con esos filtros.</p><button class="btn btn--borde" type="button" id="limpiar-2">Limpiar filtros</button></div>';
      document.getElementById('limpiar-2').addEventListener('click', function () { document.getElementById('limpiar').click(); });
    } else {
      grilla.innerHTML = res.map(T.tarjetaProducto).join('');
    }
    var cat = CATEGORIAS.filter(function (c) { return c.id === estado.cat; })[0];
    document.getElementById('titulo-cat').textContent = cat ? cat.nombre : 'Todo';
    document.getElementById('miga-actual').textContent = cat ? cat.nombre : 'Catálogo';
    document.title = (cat ? cat.nombre : 'Catálogo') + ' — NÓMADE';
    var n = cantidadFiltros();
    abrirF.innerHTML = T.icono('filtro') + 'Filtrar' + (n ? ' (' + n + ')' : '');
  }

  function actualizar(sinControles) {
    if (estado.min != null && estado.max != null && estado.min > estado.max) {
      var t = estado.min; estado.min = estado.max; estado.max = t;
      sinControles = false;
    }
    escribirURL();
    if (!sinControles) renderControles();
    renderResultados();
  }

  actualizar();
})();
