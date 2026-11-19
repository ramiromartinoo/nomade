# NÓMADE · Tienda online

Demo de tienda de ropa streetwear con el recorrido completo de compra: catálogo, producto, carrito y checkout.

- **GitHub Pages:** https://ramiromartinoo.github.io/nomade/
- **Netlify:** https://nomade-tiendaweb.netlify.app

## Páginas

| Página | Qué hace |
|---|---|
| `index.html` | Inicio con destacados |
| `catalogo.html` | Catálogo con filtros por talle, color y precio |
| `producto.html` | Detalle con elección de color y talle |
| `favoritos.html` | Prendas guardadas |
| `carrito.html` | Carrito con cupones y envío gratis desde $80.000 |
| `checkout.html` | Datos, envío y pago simulado |

## Cómo está hecho

- HTML, CSS y JavaScript sin frameworks ni build
- Los productos están en `js/productos.js` y los cálculos de precios, cupones y envío están en `js/logica.js`, aparte de la interfaz
- El carrito y los favoritos se guardan en `localStorage`. El pago es simulado: no se cobra nada

## Sobre el historial de commits

El sitio se desarrolló localmente y se publicó primero en Netlify con deploy manual (subiendo la carpeta). Este repositorio se creó después para tenerlo en GitHub, por eso el historial arranca con un único commit que contiene el sitio terminado. Los cambios nuevos se registran acá como commits normales.
