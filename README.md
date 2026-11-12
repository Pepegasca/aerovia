# Aerovia

Radar de aeronaves con **MapLibre GL JS** y datos públicos de **ADSB.lol**. Interfaz en español, tema nocturno e iconos SVG. No necesita clave de Google Maps ni de ADSB.lol.

## Funciones

- Mapa geográfico oscuro con teselas de CARTO y OpenStreetMap.
- Aeronaves posicionadas por latitud/longitud y orientadas por su rumbo.
- Ubicación del navegador (requiere HTTPS o localhost y permiso del usuario).
- Radio de 50, 100 o 200 km. Doble clic en el mapa para consultar otra zona.
- Zonas de referencia en Madrid, Barcelona, Ciudad de México, Bogotá y Buenos Aires.
- Búsqueda por indicativo, matrícula o tipo; filtro por estado; favoritos locales.
- Consulta automática cada cinco minutos mientras la página está visible, actualización manual y caché del servidor de 60 segundos.
- Estados de carga, límite de consultas, errores y ausencia de cobertura. No sustituye fallos por datos ficticios.

## Desarrollo

Node.js 20 o superior. La compilación y las pruebas no requieren instalar dependencias.

```sh
npm test
npm run build
npx wrangler dev
```

Abre la dirección que muestre Wrangler. El comando `npx` puede solicitar instalar Wrangler. La compilación genera un Worker ESM autocontenido en `dist/server/index.js`, con el HTML, JavaScript, CSS y MapLibre incluidos. `wrangler.jsonc` permite ejecutarlo o desplegarlo como Cloudflare Worker. Para publicar con Sites se usa `.openai/hosting.json`, conservando su `project_id`.

## Estructura

- `src/index.html`: interfaz y estilos.
- `src/app.js`: mapa, geolocalización, posiciones, filtros y favoritos.
- `worker/handler.js`: endpoint del mismo origen `GET /api/aircraft?lat=…&lon=…&radius=100`.
- `scripts/build.mjs`: empaqueta los recursos y el servidor.
- `tests/radar.test.mjs`: normalización, interfaz y manejo de respuestas de la API.
- `vendor/`: MapLibre GL JS 5.6.1 y su licencia.

## Datos y límites

El servidor consulta `https://api.adsb.lol/v2/point/{lat}/{lon}/{radio_en_millas_nauticas}`. Valida coordenadas y radios, aplica un tiempo máximo de espera y respeta respuestas HTTP 429. No envía coordenadas hasta solicitar una zona; al pulsar “Usar mi ubicación”, la consulta usa esas coordenadas redondeadas a tres decimales. No se guardan ubicaciones en una base de datos. Los favoritos se guardan solamente en el navegador e incluyen la última posición observada.

La vista inicial consulta Madrid como referencia, no presupone la ubicación del visitante. Se descartan posiciones sin coordenadas válidas o reportadas hace más de 120 segundos y se filtran por la distancia solicitada. Altitudes en pies se convierten a metros; velocidades en nudos, a km/h. Los campos ausentes muestran “—”.

La cobertura depende de los receptores de ADSB.lol. No se garantizan todos los aviones ni posiciones instantáneas. Este endpoint no incluye rutas, horarios ni aerolíneas confirmados. Los favoritos fuera de la zona actual se identifican como último registro y no aparecen como posiciones actuales en el mapa.

Servicios externos: [ADSB.lol](https://www.adsb.lol/), [CARTO](https://carto.com/attributions), [OpenStreetMap](https://www.openstreetmap.org/copyright) y Google Fonts. Su disponibilidad y sus condiciones de uso siguen siendo aplicables. La interfaz conserva las atribuciones cartográficas.
