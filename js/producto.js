/* NÓMADE — Ficha de producto */
(function () {
  'use strict';
  var T = window.Tienda, L = window.Logica, esc = T.esc;

  var id = new URLSearchParams(location.search).get('id');
  var p = id ? T.producto(id) : undefined;
  var cont = document.getElementById('ficha');

  if (!p) {
    document.title = 'Producto no encontrado — NÓMADE';
    cont.innerHTML = '<div class="no-encontrado"><h1>Producto no encontrado</h1>' +
      '<p style="margin:0;color:var(--ink-2)">Puede que el link esté mal o que el producto ya no esté a la venta.</p>' +
      '<a class="btn btn--acento" href="catalogo.html">Ver el catálogo</a></div>';
    return;
  }

  var cat = CATEGORIAS.filter(function (c) { return c.id === p.categoria; })[0];
  var sel = { color: p.colores[0].nombre, talle: null, cantidad: 1, img: 0 };
  document.title = p.nombre + ' — NÓMADE';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', p.descripcion);

  var agregadoHasta = 0, timerAgregado = null;
  function stockSel() { return sel.talle ? L.stockDe(p, sel.talle) : 0; }
  // Stock es por talle: descuenta lo que ya está en el carrito en cualquier color
  function disponible() { return sel.talle ? L.disponible(T.getCarrito(), p, sel.talle) : 0; }

  var stickers = '';
  if (p.nuevo) stickers += '<span class="sticker">Nuevo</span>';
  if (p.precioAnterior > p.precio) stickers += '<span class="sticker sticker--acento">-' + Math.round((1 - p.precio / p.precioAnterior) * 100) + '%</span>';

  cont.innerHTML =
    '<nav class="migas" aria-label="Ruta" style="padding-top:24px"><a href="index.html">Inicio</a><span aria-hidden="true">/</span>' +
      '<a href="catalogo.html?cat=' + cat.id + '">' + cat.nombre + '</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(p.nombre) + '</span></nav>' +
    '<div class="ficha">' +
      '<div class="galeria">' +
        '<div class="galeria__miniaturas" id="miniaturas">' + p.imagenes.map(function (src, i) {
          return '<button type="button" data-img="' + i + '" aria-label="Ver foto ' + (i + 1) + ' de ' + p.imagenes.length + '" aria-current="' + (i === 0) + '"><img src="' + src + '" alt="" width="84" height="105"></button>';
        }).join('') + '</div>' +
        '<div class="galeria__principal">' + (stickers ? '<div class="card__stickers">' + stickers + '</div>' : '') +
          '<img id="foto" src="' + p.imagenes[0] + '" alt="' + esc(p.nombre) + ', foto 1" width="900" height="1125"></div>' +
      '</div>' +
      '<div class="ficha__info">' +
        '<div><p class="eyebrow" style="margin:0 0 14px">' + cat.nombre + '</p><h1>' + esc(p.nombre) + '</h1></div>' +
        '<div><div class="ficha__precio"><span class="precio">' + L.formatPrecio(p.precio) + '</span>' +
          (p.precioAnterior > p.precio ? '<span class="precio-ant" style="font-size:18px">' + L.formatPrecio(p.precioAnterior) + '</span>' : '') + '</div>' +
          '<p class="ficha__cuotas" style="margin:6px 0 0"><b>3 cuotas sin interés</b> de ' + L.formatPrecio(L.cuotas(p.precio)) + '</p></div>' +
        '<div class="opcion"><p class="opcion__titulo" style="margin:0" id="t-color">Color: <span id="color-nombre"></span></p>' +
          '<div class="chips" role="radiogroup" aria-labelledby="t-color" id="colores"></div></div>' +
        '<div class="opcion"><p class="opcion__titulo" style="margin:0" id="t-talle">Talle <span>Calce oversize: si dudás, pedí tu talle de siempre</span></p>' +
          '<div class="talles" role="radiogroup" aria-labelledby="t-talle" id="talles"></div>' +
          '<p class="stock-aviso" id="stock-aviso" role="status"></p></div>' +
        '<div class="comprar">' +
          '<div class="cantidad" role="group" aria-label="Cantidad">' +
            '<button type="button" id="menos" aria-label="Restar uno">' + T.icono('menos') + '</button>' +
            '<output id="cant" aria-live="polite">1</output>' +
            '<button type="button" id="mas" aria-label="Sumar uno">' + T.icono('mas') + '</button></div>' +
          '<button class="btn btn--acento" type="button" id="agregar">Elegí un talle</button>' +
          '<button class="fav-grande" type="button" data-fav="' + p.id + '"></button>' +
        '</div>' +
        '<div class="ficha__desc"><p>' + esc(p.descripcion) + '</p>' +
          '<ul class="ficha__datos">' +
            '<li>' + T.icono('camion') + 'Envío gratis desde ' + L.formatPrecio(L.ENVIO_GRATIS_DESDE) + ' · retiro gratis en Palermo</li>' +
            '<li>' + T.icono('cambio') + 'Primer cambio gratis dentro de los 30 días</li>' +
            '<li>' + T.icono('tarjeta') + '3 cuotas sin interés con tarjeta de crédito</li>' +
          '</ul></div>' +
      '</div>' +
    '</div>';

  /* Galería */
  var foto = document.getElementById('foto');
  document.getElementById('miniaturas').addEventListener('click', function (e) {
    var b = e.target.closest('[data-img]');
    if (!b) return;
    sel.img = +b.getAttribute('data-img');
    foto.src = p.imagenes[sel.img];
    foto.alt = p.nombre + ', foto ' + (sel.img + 1);
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-current', x === b); });
  });

  /* Favorito */
  function renderFav() {
    var on = T.getFavoritos().indexOf(p.id) !== -1;
    var b = document.querySelector('.fav-grande');
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', (on ? 'Quitar de favoritos: ' : 'Agregar a favoritos: ') + p.nombre);
    b.innerHTML = T.icono(on ? 'corazon-lleno' : 'corazon');
  }
  document.addEventListener('favoritos:cambio', renderFav);

  /* Color y talle */
  function renderOpciones() {
    document.getElementById('color-nombre').textContent = sel.color;
    document.getElementById('colores').innerHTML = p.colores.map(function (c) {
      var on = c.nombre === sel.color;
      return '<button class="swatch" type="button" role="radio" data-color="' + c.nombre + '" aria-checked="' + on + '" aria-label="' + c.nombre + '" tabindex="' + (on ? 0 : -1) + '"><i style="background:' + c.hex + '"></i></button>';
    }).join('');
    document.getElementById('talles').innerHTML = p.talles.map(function (t) {
      var on = t.talle === sel.talle;
      var sin = t.stock === 0;
      return '<button class="chip" type="button" role="radio" data-talle="' + t.talle + '" aria-checked="' + on + '"' + (sin ? ' disabled aria-label="Talle ' + t.talle + ', agotado"' : '') + '>' + t.talle + '</button>';
    }).join('');
  }

  function renderCompra() {
    var disp = disponible();
    if (sel.talle && sel.cantidad > disp) sel.cantidad = Math.max(1, disp);
    document.getElementById('cant').textContent = sel.cantidad;
    document.getElementById('menos').disabled = sel.cantidad <= 1;
    document.getElementById('mas').disabled = !sel.talle || sel.cantidad >= disp;
    var btn = document.getElementById('agregar');
    var aviso = document.getElementById('stock-aviso');
    if (!sel.talle) {
      btn.disabled = false; btn.setAttribute('aria-disabled', 'true'); btn.textContent = 'Elegí un talle';
      aviso.textContent = '';
    } else if (disp === 0) {
      btn.disabled = true; btn.removeAttribute('aria-disabled'); btn.textContent = 'Ya tenés todo el stock';
      aviso.textContent = 'Ya tenés en el carrito las ' + stockSel() + ' unidades disponibles de este talle.';
    } else {
      btn.disabled = false; btn.removeAttribute('aria-disabled'); btn.textContent = 'Agregar al carrito';
      aviso.textContent = stockSel() <= 2 ? '¡Quedan solo ' + stockSel() + '!' : '';
    }
    // Confirmación breve después de agregar (sin abrir ningún panel)
    var recien = sel.talle && Date.now() < agregadoHasta;
    btn.classList.toggle('agregado', !!recien);
    if (recien) {
      if (disp > 0) btn.innerHTML = T.icono('check') + 'Agregado';
      aviso.innerHTML = 'Listo, quedó en tu carrito · <a href="carrito.html">Ver carrito</a>';
    }
  }

  document.getElementById('colores').addEventListener('click', function (e) {
    var b = e.target.closest('[data-color]');
    if (!b) return;
    sel.color = b.getAttribute('data-color');
    renderOpciones(); renderCompra();
    document.querySelector('#colores [data-color="' + sel.color + '"]').focus();
  });
  document.getElementById('talles').addEventListener('click', function (e) {
    var b = e.target.closest('[data-talle]');
    if (!b || b.disabled) return;
    sel.talle = b.getAttribute('data-talle');
    sel.cantidad = 1;
    renderOpciones(); renderCompra();
    document.querySelector('#talles [data-talle="' + sel.talle + '"]').focus();
  });
  document.getElementById('menos').addEventListener('click', function () { if (sel.cantidad > 1) { sel.cantidad--; renderCompra(); } });
  document.getElementById('mas').addEventListener('click', function () { if (sel.cantidad < disponible()) { sel.cantidad++; renderCompra(); } });
  document.getElementById('agregar').addEventListener('click', function () {
    if (!sel.talle) {
      var aviso = document.getElementById('stock-aviso');
      aviso.textContent = 'Elegí un talle para agregar al carrito.';
      var primero = document.querySelector('#talles .chip:not([disabled])');
      if (primero) primero.focus();
      return;
    }
    if (disponible() <= 0) return;
    agregadoHasta = Date.now() + 2200;
    var cantidad = sel.cantidad;
    sel.cantidad = 1;
    T.agregar({ id: p.id, color: sel.color, talle: sel.talle, cantidad: cantidad });
    clearTimeout(timerAgregado);
    timerAgregado = setTimeout(renderCompra, 2250);
  });
  document.addEventListener('carrito:cambio', renderCompra);

  renderOpciones();
  renderCompra();
  renderFav();

  /* Relacionados */
  var rel = PRODUCTOS.filter(function (x) { return x.categoria === p.categoria && x.id !== p.id; });
  var otros = PRODUCTOS.filter(function (x) { return x.categoria !== p.categoria && x.nuevo; });
  rel = rel.concat(otros).slice(0, 4);
  document.getElementById('grilla-rel').innerHTML = rel.map(T.tarjetaProducto).join('');
  document.getElementById('rel-link').href = 'catalogo.html?cat=' + cat.id;
  document.getElementById('rel-link').textContent = 'Ver ' + cat.nombre.toLowerCase();
  document.getElementById('relacionados').hidden = false;
})();
