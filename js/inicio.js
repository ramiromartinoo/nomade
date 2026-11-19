/* NÓMADE — Inicio */
(function () {
  'use strict';
  var T = window.Tienda;

  var FOTOS_CAT = { remeras: 'img/cat-remeras.jpg', buzos: 'img/cat-buzos.jpg', pantalones: 'img/cat-pantalones.jpg', camperas: 'img/cat-camperas.jpg' };
  document.getElementById('cats').innerHTML = CATEGORIAS.map(function (c) {
    return '<a class="cat" href="catalogo.html?cat=' + c.id + '">' +
      '<img src="' + FOTOS_CAT[c.id] + '" alt="" loading="lazy" width="900" height="1200">' +
      '<span class="cat__txt"><b>' + c.nombre + '</b>' + T.icono('flecha') + '</span></a>';
  }).join('');

  var beneficios = [
    ['camion', 'Envío gratis desde ' + Logica.formatPrecio(Logica.ENVIO_GRATIS_DESDE), 'A todo el país, llega en 3 a 6 días hábiles'],
    ['tarjeta', '3 cuotas sin interés', 'Con todas las tarjetas de crédito'],
    ['cambio', 'Cambios gratis por 30 días', 'En el local o por correo, sin vueltas']
  ];
  document.getElementById('beneficios').innerHTML = beneficios.map(function (b) {
    return '<div class="beneficio">' + T.icono(b[0]) + '<div><b>' + b[1] + '</b><span>' + b[2] + '</span></div></div>';
  }).join('');

  function renderNuevo() {
    var nuevos = PRODUCTOS.filter(function (p) { return p.nuevo; }).slice(0, 4);
    document.getElementById('grilla-nuevo').innerHTML = nuevos.map(T.tarjetaProducto).join('');
  }
  renderNuevo();
})();
