# Real-world data architecture

Elcano should use real geography and observed environmental patterns without making the core game depend on a network service at runtime.

## Decision

Use a **static-first hybrid**:

1. **Geography:** bundle generalized Natural Earth-derived vector land data with the application.
2. **Simulation coordinates:** store durable positions as WGS84 latitude/longitude.
3. **Projection:** project lat/lon into Web Mercator only at the presentation boundary.
4. **Environmental fields:** keep `windAt(position, time)` and `currentAt(position, time)` behind a provider interface.
5. **Historical/default environment:** preprocess observed wind/current archives into a compact monthly climatology which is bundled into the production JavaScript.
6. **Offline fallback:** retain a tiny analytic climatology for offline development, locations outside the baked region, and missing source cells.
7. **Live mode:** optional APIs may later provide present/forecast conditions, but must not become a dependency of historical missions or the core simulation.

## Geography

The first implementation uses `world-atlas` `land-50m.json`, a pre-built TopoJSON redistribution derived from Natural Earth. Natural Earth vector/raster data is public domain and available at 1:10m, 1:50m and 1:110m scales.

The current 50m land topology is roughly 533 KB before HTTP compression. This is intentionally larger than the ~54 KB 110m topology because coastlines and islands are gameplay data. If payload becomes a concern, geography can later use multiple static levels of detail rather than forcing all navigation onto the coarse 110m map.

Why static vector geography rather than a tile/map API:

- works on static Netlify hosting and after the initial asset load does not depend on a map service;
- no API key, quota or CORS dependency;
- coastlines are simulation/content data rather than a remote visual service;
- rendering style remains under game control;
- later detail levels can be swapped by zoom level.

A tile provider can still be added later for optional labels or visual detail, but should be presentation-only.

## Coordinates and projection

Simulation truth is `{ lat, lon }`.

Environmental vectors are east/north components in knots. Ship headings use nautical bearings: 0° north, 90° east, clockwise positive.

The chart currently uses Web Mercator because it is familiar, conformal, tile-compatible and keeps rendering/camera concerns separate from the simulation. High-latitude distortion is therefore a presentation issue rather than a physics issue.

Movement is currently integrated with a local tangent-plane nautical-mile approximation. For normal voyage timesteps this is adequate; longer-step/geodesic integration can replace it later without changing UI code.

## Baked Atlantic climatology

Production builds run:

```bash
npm run world:data
```

`scripts/build-world-data.mjs` requests coarse subsets from public NOAA ERDDAP endpoints, averages them by calendar month and emits `src/world/data/atlantic-climatology.generated.ts`.

The baked region currently covers approximately:

- 60°S to 65°N;
- 100°W to 30°E;
- 5° grid spacing;
- 12 monthly slices.

Four components are stored per grid cell: wind east/north and current east/north. Values are converted to knots, quantized to 0.01 kn and packed as signed 16-bit integers before base64 encoding. The packed binary payload itself is only about 66 KiB before base64/JavaScript and HTTP compression.

At runtime `grid-environment.ts` decodes this local asset once and bilinearly interpolates the four surrounding cells. The sailing simulation still calls the same synchronous `windAt(position, time)` and `currentAt(position, time)` functions.

The browser does **not** query NOAA, Copernicus, ERA5, OSCAR or another remote environmental service during gameplay.

## Wind source

The first baked wind source is **CCMP V2 monthly 10 m ocean surface vector winds**, exposed by NOAA ERDDAP. It provides eastward (`uwnd`) and northward (`vwnd`) wind components at 0.25° resolution for 1987–2019. The build pipeline samples this onto the much smaller Elcano grid and averages all available years by calendar month.

This is used as a climatological pattern, not as the literal weather of a historical date.

ERA5 remains a strong future preprocessing alternative because it provides global atmospheric reanalysis from 1940 onward. For missions before the reanalysis era, including the 16th century, neither ERA5 nor CCMP represents observed historical weather. A mission should use climatological prevailing conditions plus, later, deterministic seeded variability and describe them as historically plausible rather than observed fact.

## Current source

The first baked current source is the NOAA-hosted **OSCAR sea-surface velocity archive**, with zonal (`u`) and meridional (`v`) currents at roughly 1/3° resolution over 1992–2018.

To keep preprocessing reasonably light, the builder samples the roughly five-day archive at a 30-day stride, groups those observations by calendar month and averages them across years before quantization. This is deliberately a prevailing-current climatology, not a reconstruction of a specific historical voyage.

Copernicus Marine GLORYS12V1 remains a higher-resolution future option. It provides eastward/northward sea-water velocity on a global 1/12° grid, but the full scientific dataset should never be delivered to a browser. It would use the same preprocessing/provider boundary.

## Historical vs live conditions

Historical missions should specify an environment dataset ID and scenario date. The date chooses the climatological month and can later seed deterministic weather variability. It must not silently substitute today's weather.

A future modern/free-sail mode may use live weather/current APIs, but those providers are optional infrastructure adapters. Live service availability must not be required for historical missions or the static core game.

## Provider boundary

```ts
interface EnvironmentProvider {
  windAt(position: GeoPosition, time: Date): { x: number; y: number };
  currentAt(position: GeoPosition, time: Date): { x: number; y: number };
}
```

The sailing simulation consumes this interface only. A provider may be:

- packed observed climatology;
- simplified offline fallback;
- future historical/reanalysis scenario data;
- deterministic generated weather layered over climatology;
- optional live API data.

## Build and caching implications

Scientific source data is downloaded only by the **build**, not by each player. Netlify serves the resulting static hashed assets. A returning browser can cache unchanged assets, and Netlify/CDN compression substantially reduces the transfer relative to the raw source files.

The current production build intentionally fails if the observed climatology cannot be generated, rather than silently publishing a supposedly real-data build using the fallback. For offline development, `npm run build:offline` uses the checked-in fallback placeholder.

## Near-term sequence

1. Validate the generated environmental grid in a Netlify deploy preview.
2. Add coastline collision/land detection separately from rendering.
3. Add the first historical route/scenario definition with an explicit date and environment dataset ID.
4. Tune spatial resolution only if gameplay shows that 5° environmental cells are too coarse.
5. Only then consider optional live weather/current adapters.
