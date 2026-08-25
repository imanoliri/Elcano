# Real-world data architecture

Elcano should use real geography without making its core simulation depend on a network service.

## Decision

Use a **static-first hybrid**:

1. **Geography:** bundle generalized Natural Earth-derived vector land data with the application.
2. **Simulation coordinates:** store durable positions as WGS84 latitude/longitude.
3. **Projection:** project lat/lon into Web Mercator only at the presentation boundary.
4. **Environmental fields:** keep `windAt(position, time)` and `currentAt(position, time)` behind a provider interface.
5. **Offline default:** ship a small baked climatology provider so the game always works without a server.
6. **Historical missions:** later ship compact datasets derived offline from atmospheric/ocean reanalysis or climatology rather than querying today's weather.
7. **Live mode:** optional APIs may provide present/forecast conditions, but must not become a dependency of historical missions or the core simulation.

## Geography

The first implementation uses `world-atlas` `land-50m.json`, a pre-built TopoJSON redistribution derived from Natural Earth. Natural Earth vector/raster data is public domain and available at 1:10m, 1:50m and 1:110m scales.

Why static vector geography rather than a tile/map API:

- works offline and on static Netlify hosting;
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

## Wind

### Current/live weather

A live provider can query a weather service by lat/lon/time for wind vectors. This is useful for a modern/free-sail mode but is not appropriate as the default for historical missions.

### Historical and climatological wind

ERA5 is a strong source for later preprocessing because it provides global atmospheric reanalysis from 1940 onward, including 10 m eastward (`u`) and northward (`v`) wind components.

For missions before the reanalysis era (for example Elcano in the 16th century), do not pretend ERA5 represents the exact historical day. Prefer monthly/seasonal climatological patterns, optionally perturbed with deterministic seeded variation. The result should be described as historically plausible prevailing conditions, not observed weather.

Recommended future baked format:

```text
wind/<dataset>/<month>.bin
  regular lat/lon grid
  u-east knots
  v-north knots
```

`windAt(position, time)` bilinearly interpolates the nearest cells and selects/interpolates the month/time slice.

## Ocean currents

Copernicus Marine's Global Ocean Physics Reanalysis (GLORYS12V1) provides eastward and northward sea-water velocity on a global 1/12° grid from 1993 onward, with daily/monthly products and a monthly climatology product.

For Elcano, the most useful product is not the full reanalysis download in the browser. Preprocess surface currents offline into a much smaller monthly climatology grid and bundle the relevant resolution/region with the static game.

Recommended future baked format mirrors wind:

```text
currents/<dataset>/<month>.bin
  regular lat/lon grid
  u-east knots
  v-north knots
```

This keeps `currentAt(position, time)` independent of the original scientific-data format.

## Optional live marine adapter

Open-Meteo's Marine API currently exposes ocean-current velocity/direction by lat/lon and can be useful for a live mode or development comparison. It explicitly notes reduced coastal accuracy. Treat it as an optional infrastructure adapter, never as navigation truth or a historical mission source.

## Provider boundary

```ts
interface EnvironmentProvider {
  windAt(position: GeoPosition, time: Date): { x: number; y: number };
  currentAt(position: GeoPosition, time: Date): { x: number; y: number };
}
```

The sailing simulation consumes this interface only. A provider may be:

- simplified baked climatology;
- baked gridded climatology;
- historical/reanalysis scenario data;
- deterministic generated weather layered over climatology;
- optional live API data.

## Near-term sequence

1. Stabilize the real-world map and geographic movement.
2. Add coastline collision/land detection separately from rendering.
3. Replace the simplified climatology provider with a small baked Atlantic monthly wind/current grid.
4. Add the first historical route/scenario definition with an explicit date and environment dataset ID.
5. Only then consider optional live weather/current adapters.
