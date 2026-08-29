# Real-world data architecture

Elcano uses real geography and observed environmental patterns while keeping the tutorial and core sailing loop usable without a runtime data service.

## Decision

Use a **static-first hybrid**:

1. **Geography:** bundle generalized Natural Earth-derived vector land data with the application.
2. **Simulation coordinates:** store durable positions as WGS84 latitude/longitude.
3. **Projection:** project lat/lon into Web Mercator only at the presentation boundary.
4. **Environmental fields:** keep `windAt(position, time)` and `currentAt(position, time)` behind a provider interface.
5. **Tutorial/default region:** bundle a high-resolution observed reference field for the Bay of Biscay.
6. **Global coverage:** outside that baked region, lazily request coarse observed environment tiles only for the visible map area and retain a small LRU cache.
7. **Offline fallback:** retain a tiny analytic climatology for missing cells, failed requests, polar gaps and offline use.

## Geography

The implementation uses `world-atlas` Natural Earth-derived land topology. A 50m world layer provides the base map and a 10m layer is used for close-zoom coastline detail.

Simulation truth remains geographic; rendering detail can change independently with zoom.

## Coordinates and projection

Simulation truth is `{ lat, lon }`.

Environmental vectors are east/north components in knots. Ship headings use nautical bearings: 0° north, 90° east, clockwise positive.

The chart uses Web Mercator because it is familiar, conformal and tile-compatible. High-latitude distortion is a presentation issue rather than simulation truth.

## Baked Bay of Biscay data

`scripts/build-world-data.mjs` produces `src/world/data/atlantic-climatology.generated.ts`.

The currently checked-in high-resolution tutorial region is approximately:

- wind: 41.125°N–46.375°N, 11.375°W–0.875°E at 0.25°;
- current: 41.04°N–46.48°N, 11.44°W–0.96°E at about 0.08°;
- 12 monthly slices.

Wind comes from CCMP V2 monthly 10 m ocean-surface vector winds. Current comes from a HYCOM 2012 monthly surface reference field. Values are converted to knots, quantized and packed into the application.

The sailing simulation still uses synchronous `windAt(position, time)` and `currentAt(position, time)` calls.

## Lazy global environment tiles

`src/world/global-environment-tiles.ts` extends the synchronous provider with an asynchronous cache behind it.

When the camera settles outside the baked Bay of Biscay region:

1. the visible geographic bounds are divided into 20° environment tiles;
2. only the nearest visible tiles are requested, capped per prefetch pass;
3. CCMP wind and NOAA-hosted OSCAR surface-current data are sampled to roughly 1° for the requested tile;
4. loaded tiles are stored in a 32-tile LRU-style memory cache;
5. the environment overlay redraws when a tile arrives;
6. until a tile is available, the simulation uses the deterministic analytic fallback.

The tutorial region deliberately does **not** require these network requests. Its higher-resolution baked data remains preferred there.

The global tile reference year is currently 2012 and the historical mission month selects the corresponding modern reference month. This gives geographically real wind/current structure without pretending that the data is literal weather from 1525.

## Dynamic weather layer

`src/world/weather.ts` adds a deterministic, basin-level low-pressure layer after the background provider is sampled. It affects wind strongly and current only lightly. The game generates year-round mid-latitude storm tracks in the Atlantic, North Pacific and Southern Ocean, then season-gated tropical systems in the Pacific and Indian basins. See [SEAS_AND_WEATHER.md](./SEAS_AND_WEATHER.md) for basin profiles, intensity classes, seasons and explicit gameplay abstractions.

This runtime layer is intended as the first global implementation. A later production hardening step can preprocess the same global tiles into static CDN assets so historical/free-sail play can become fully network-independent again while retaining lazy viewport loading.

## Wind source

The global wind tile source is **CCMP V2 monthly 10 m ocean surface vector winds**, exposed through NOAA ERDDAP. It provides eastward (`uwnd`) and northward (`vwnd`) components at 0.25° native resolution; runtime tiles stride that source to approximately 1°.

For missions before the modern observation/reanalysis era, these fields represent plausible prevailing patterns, not observed historical weather.

## Current source

The global current tile source is the NOAA-hosted **OSCAR sea-surface velocity archive**, with zonal (`u`) and meridional (`v`) current components at roughly 1/3° native resolution. Runtime tiles stride the source to approximately 1°.

The baked Bay of Biscay tutorial current field remains the higher-resolution HYCOM-derived dataset.

## Provider boundary

```ts
interface EnvironmentProvider {
  windAt(position: GeoPosition, time: Date): { x: number; y: number };
  currentAt(position: GeoPosition, time: Date): { x: number; y: number };
}
```

Provider order is now:

1. baked high-resolution Bay of Biscay data when available;
2. loaded global observed tile outside that region;
3. deterministic analytic climatology as fallback.

Weather-system influence is then composed with that sampled background. It is not an additional remote data request.

## Performance and caching

The camera does not fetch on every movement event. Global prefetch is debounced after camera motion and capped at 12 tiles per visible-area pass.

Only visible-area vectors are rendered. Environment tiles are kept in memory up to 32 entries and browser HTTP caching is enabled for source requests.

This avoids loading a planet-wide scientific dataset into memory simply because the world map itself is global.

## Near-term sequence

1. Harden the global tile source/error telemetry over longer voyages.
2. Consider preprocessing global environment tiles into static CDN assets for fully deterministic historical missions.
3. Add coastline collision/grounding.
4. Add course trail, labels and nautical scale.
5. Introduce ship/rig polar differences once navigation infrastructure is stable.
