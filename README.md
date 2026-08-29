# Elcano

Elcano is a static-first browser sailing and exploration game inspired by Juan Sebastián Elcano and the navigational problems of the Age of Sail.

The core idea is simple: **the ocean is the game**. Players do not merely point a ship at a destination. They read wind, currents and incomplete information, choose a route, and adapt as conditions change. The geographically shortest route should often be worse than a longer route that exploits the sea.

## Current status

`main` contains the first abstract-world MVP. The `feature/real-world-map` branch is migrating that gameplay onto real geography.

The branch currently includes:

- real Natural Earth-derived coastlines and islands bundled into the static build;
- WGS84 latitude/longitude as simulation position truth;
- Web Mercator as a rendering-only map projection;
- nautical headings and east/north environmental vectors;
- movement in knots/nautical miles over geographic coordinates;
- pluggable `windAt(position, time)` / `currentAt(position, time)` environment providers;
- a simplified offline climatology provider as the initial fallback;
- preserved helm, sails, time acceleration, fog-of-war, HUD and ship-force telemetry;
- preserved mobile pan/pinch/wheel camera behavior;
- a camera target supplied by projected game data rather than hard-coded canvas coordinates;
- static Netlify-compatible deployment.

See [WORLD_DATA.md](./WORLD_DATA.md) for the real-world geography, wind and current data strategy, and [SEAS_AND_WEATHER.md](./SEAS_AND_WEATHER.md) for the gameplay reference to prevailing conditions and dynamic storms.

For a player-facing inventory of everything currently implemented, see [FEATURES.md](./FEATURES.md). Planned work is kept separately in [FUTURE.md](./FUTURE.md).

## Vision

Elcano should develop into a navigation, exploration and cartography game in which players:

- understand and exploit regional winds and ocean currents;
- choose routes rather than follow waypoint arrows;
- navigate with imperfect knowledge;
- discover coastlines, islands and safe passages;
- build maps from experience;
- undertake historically inspired expeditions;
- learn why historical routes developed the way they did.

The long-term experience should reward observation and navigational judgment more than reflexes.

## Design principles

1. **The ocean is the simulation.** Wind, currents, ship behavior and geography are first-class systems.
2. **Static first.** The complete core game should run in the browser without a server.
3. **Simulation before spectacle.** Visuals should expose the underlying systems rather than conceal them.
4. **World truth and player knowledge are different.** The simulation may know more than the player has discovered.
5. **Routes are decisions.** A destination is an objective, not an autopilot instruction.
6. **Historical inspiration, playable abstraction.** Use real navigational ideas without requiring professional seamanship knowledge.
7. **Mobile is a first-class platform.** Controls and map interaction must work naturally with touch.

## Repository structure

```text
src/
  main.ts              Game shell, orchestration and current canvas rendering
  simulation.ts        Sailing and geographic world-state stepping
  world/
    coordinates.ts     Lat/lon, projection and nautical-distance helpers
    environment.ts     Pluggable wind/current provider boundary
    geography.ts       Static Natural Earth-derived land rendering
  telemetry-ui.ts      Additional helm/sail/ship-force instrumentation
  camera-ui.ts         Map pan, zoom, pinch and target edge indicator
```

For the intended system boundaries and future refactoring direction, see [ARCHITECTURE.md](./ARCHITECTURE.md).

For instructions for AI coding agents working in this repository, see [AGENTS.md](./AGENTS.md).

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The app is built with TypeScript and Vite and is deployable as a static Netlify site.

## Near-term priorities

- stabilize real-world movement and camera behavior on desktop/mobile;
- add coastline/land collision as simulation/world logic rather than render logic;
- replace the simplified environmental fallback with compact baked Atlantic monthly wind/current grids;
- move the current tutorial into a data-driven scenario definition;
- add the first historical route with an explicit date/environment dataset;
- preserve deterministic simulation behavior where practical.

## Deployment workflow

- `main` is the production branch.
- Feature work should happen on branches and be reviewed through pull requests.
- Netlify deploy previews should be used to test UI and gameplay changes before merging.
- Do not merge into `main` until the requested feature is working in the preview.
