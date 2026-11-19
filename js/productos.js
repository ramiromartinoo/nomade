/* NÓMADE — catálogo de productos (datos de demo). */
(function (raiz) {
  'use strict';

  var NEGRO = { nombre: 'Negro', hex: '#151515' };
  var BLANCO = { nombre: 'Blanco', hex: '#F5F5F0' };
  var GRIS = { nombre: 'Gris', hex: '#8A8A85' };
  var ARENA = { nombre: 'Arena', hex: '#C9B79C' };
  var TIERRA = { nombre: 'Tierra', hex: '#8B5E3C' };
  var OLIVA = { nombre: 'Oliva', hex: '#5B6340' };
  var BOSQUE = { nombre: 'Bosque', hex: '#2F4A3A' };
  var ROSA = { nombre: 'Rosa', hex: '#D9A3A0' };
  var AZUL = { nombre: 'Azul', hex: '#24365C' };

  function t(s, m, l, xl, xxl) {
    return [
      { talle: 'S', stock: s }, { talle: 'M', stock: m }, { talle: 'L', stock: l },
      { talle: 'XL', stock: xl }, { talle: 'XXL', stock: xxl }
    ];
  }

  var CATEGORIAS = [
    { id: 'remeras', nombre: 'Remeras' },
    { id: 'buzos', nombre: 'Buzos' },
    { id: 'pantalones', nombre: 'Pantalones' },
    { id: 'camperas', nombre: 'Camperas' }
  ];

  var PRODUCTOS = [
    {
      id: 'remera-box-fit', nombre: 'Remera Box Fit', categoria: 'remeras',
      precio: 18900, colores: [BLANCO, NEGRO], talles: t(4, 8, 6, 3, 0),
      imagenes: ['img/remera-box-1.jpg', 'img/remera-box-2.jpg'],
      descripcion: 'Corte recto y cuadrado, hombros caídos. Algodón peinado 24/1 de 210 g, cuello reforzado que no se deforma. La base de cualquier outfit.',
      nuevo: true
    },
    {
      id: 'remera-grafica-smile', nombre: 'Remera Gráfica Smile', categoria: 'remeras',
      precio: 21500, precioAnterior: 26900, colores: [BLANCO], talles: t(2, 5, 5, 2, 1),
      imagenes: ['img/remera-grafica-1.jpg', 'img/remera-grafica-2.jpg'],
      descripcion: 'Estampa frontal en serigrafía al agua, tacto suave que aguanta los lavados. Calce relajado.',
      nuevo: false
    },
    {
      id: 'remera-oversize-noche', nombre: 'Remera Oversize Noche', categoria: 'remeras',
      precio: 23900, colores: [NEGRO, TIERRA], talles: t(3, 6, 4, 4, 2),
      imagenes: ['img/remera-oversize-1.jpg', 'img/remera-oversize-2.jpg'],
      descripcion: 'Oversize de verdad: largo extra y manga al codo. Jersey pesado de 240 g con lavado enzimático para un color apagado.',
      nuevo: true
    },
    {
      id: 'buzo-arena', nombre: 'Buzo Hoodie Arena', categoria: 'buzos',
      precio: 42900, colores: [ARENA, TIERRA], talles: t(3, 5, 4, 2, 1),
      imagenes: ['img/buzo-arena-1.jpg', 'img/buzo-arena-2.jpg'],
      descripcion: 'Frisa invisible de 320 g, capucha doble sin cordón y bolsillo canguro. Abrigado sin ser pesado.',
      nuevo: true
    },
    {
      id: 'buzo-base', nombre: 'Buzo Hoodie Base', categoria: 'buzos',
      precio: 39900, colores: [BLANCO, GRIS], talles: t(0, 4, 6, 3, 2),
      imagenes: ['img/buzo-base-1.jpg', 'img/buzo-base-2.jpg'],
      descripcion: 'El hoodie de todos los días. Bordado chico en el pecho, puños y cintura en rib.',
      nuevo: false
    },
    {
      id: 'buzo-bosque', nombre: 'Buzo Hoodie Bosque', categoria: 'buzos',
      precio: 37900, precioAnterior: 45900, colores: [BOSQUE, GRIS], talles: t(2, 3, 3, 1, 0),
      imagenes: ['img/buzo-bosque-1.jpg', 'img/buzo-bosque-2.jpg'],
      descripcion: 'Teñido en prenda para un verde profundo e irrepetible. Capucha amplia y corte boxy.',
      nuevo: false
    },
    {
      id: 'cargo-negro', nombre: 'Pantalón Cargo Negro', categoria: 'pantalones',
      precio: 46900, colores: [NEGRO], talles: t(3, 5, 5, 3, 2),
      imagenes: ['img/cargo-negro-1.jpg', 'img/cargo-negro-2.jpg'],
      descripcion: 'Gabardina con elastano, seis bolsillos y botamanga con cordón para usarlo recto o ajustado.',
      nuevo: true
    },
    {
      id: 'cargo-arena', nombre: 'Pantalón Cargo Arena', categoria: 'pantalones',
      precio: 46900, colores: [ARENA, OLIVA], talles: t(2, 4, 0, 2, 1),
      imagenes: ['img/cargo-arena-1.jpg', 'img/cargo-arena-2.jpg'],
      descripcion: 'Tiro medio y pierna amplia. Bolsillos fuelle laterales y cinturón de reata incluido.',
      nuevo: false
    },
    {
      id: 'jogger-rosa', nombre: 'Jogger Cargo Rosa', categoria: 'pantalones',
      precio: 34900, colores: [ROSA], talles: t(3, 4, 3, 1, 0),
      imagenes: ['img/jogger-rosa-1.jpg', 'img/jogger-rosa-2.jpg'],
      descripcion: 'Rústico liviano con puño elastizado. Cómodo para todo el día, con bolsillos cargo.',
      nuevo: false
    },
    {
      id: 'campera-coach', nombre: 'Campera Coach Negra', categoria: 'camperas',
      precio: 68900, colores: [NEGRO], talles: t(2, 4, 4, 2, 1),
      imagenes: ['img/campera-coach-1.jpg', 'img/campera-coach-2.jpg'],
      descripcion: 'Nylon rompeviento con forro de malla, cierre a broches y cuello camisero. La clásica de skate.',
      nuevo: true
    },
    {
      id: 'campera-varsity', nombre: 'Campera Varsity', categoria: 'camperas',
      precio: 94900, colores: [AZUL, TIERRA], talles: t(1, 2, 2, 1, 0),
      imagenes: ['img/campera-varsity-1.jpg', 'img/campera-varsity-2.jpg'],
      descripcion: 'Paño con mangas símil cuero, parches bordados y rib a rayas. Edición limitada.',
      nuevo: true
    },
    {
      id: 'campera-puffer', nombre: 'Campera Puffer Nube', categoria: 'camperas',
      precio: 79900, precioAnterior: 98900, colores: [GRIS, NEGRO], talles: t(2, 3, 3, 2, 1),
      imagenes: ['img/campera-puffer-1.jpg', 'img/campera-puffer-2.jpg'],
      descripcion: 'Inflada con guata siliconada, capucha fija y puños con elástico. Corta a la cintura.',
      nuevo: false
    }
  ];

  var datos = { PRODUCTOS: PRODUCTOS, CATEGORIAS: CATEGORIAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = datos;
  else { raiz.PRODUCTOS = PRODUCTOS; raiz.CATEGORIAS = CATEGORIAS; }
})(this);
