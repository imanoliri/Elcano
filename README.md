# Elcano

Elcano is a static-first browser sailing and exploration game inspired by Juan Sebastián Elcano and the navigational problems of the Age of Sail.

The core idea is simple: **the ocean is the game**. Players do not merely point a ship at a destination. They read wind, currents and incomplete information, choose a route, and adapt as conditions change. The geographically shortest route should often be worse than a longer route that exploits the sea.

## Current status

The first playable MVP is merged into `main`.

It currently includes:

- a 1000 × 650 simulated ocean world;
- ship heading and sail controls;
- wind and current vector fields;
- movement derived from sail-driven velocity plus current;
- fog-of-war exploration;
- a tutorial destination and landfall objective;
- time acceleration;
- ship-relative wind/current/track instrumentation;
- mobile-first helm and sail telemetry;
- a pannable and zoomable map camera;
- mouse-wheel, drag and touch/pinch navigation;
- an off-screen destination indicator;
- static Netlify deployment.

## Vision

Elcano should develop into a navigation, exploration and cartography game in which players:

- understand and exploit regional winds and ocean currents;
- choose routes rather than follow waypoint arrows;
- navigate with imperfect knowledge;
- discover coastlines, islands and safe passages;
- build maps from experience;
- manage weather, supplies, ship condition and crew;
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
  main.ts           Game shell, current simulation loop and rendering
  simulation.ts     Sailing, wind, currents and world-state calculations
  telemetry-ui.ts   Additional helm/sail/ship-force instrumentation
  camera-ui.ts      Map pan, zoom, pinch and target edge indicator
  style.css         Main UI styling
  telemetry-ui.css  Telemetry and force-panel styling
  camera-ui.css     Camera-specific canvas and indicator styling
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

The current prototype proves the interaction loop, but several foundations should be improved before adding large amounts of content:

- replace abstract canvas coordinates with a coherent geographic/world-coordinate model;
- define nautical heading conventions consistently;
- define wind direction semantics consistently (`from` vs `toward`);
- calibrate distance, speed and time units;
- formalize camera/world/screen coordinate transforms;
- separate the current game loop further from presentation code;
- introduce scenario/world data instead of embedding the tutorial world in UI code;
- preserve deterministic simulation behavior where practical.

## Deployment workflow

- `main` is the production branch.
- Feature work should happen on branches and be reviewed through pull requests.
- Netlify deploy previews should be used to test UI and gameplay changes before merging.
- Do not merge into `main` until the requested feature is working in the preview.
