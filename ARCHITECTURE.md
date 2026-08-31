# Elcano Architecture

## Purpose

This document defines the intended technical architecture for Elcano as the project grows beyond the current MVP.

The central architectural rule is:

> **The ocean simulation is the product. UI, storage and online services are adapters around it.**

The game should remain playable as a static browser application. Server-side systems may be added later, but they must not become prerequisites for the core simulation.

## Architectural goals

- deterministic, testable simulation logic;
- clear separation between world state and presentation;
- browser-first and mobile-first runtime;
- static deployment with no mandatory backend;
- data-driven ships, scenarios and world layers;
- scalable world representation suitable for real geography later;
- explicit coordinate transformations;
- easy replay, save/load and automated testing;
- optional online services that do not contaminate the simulation core.

## Target layers

```text
┌─────────────────────────────────────────────┐
│                 Presentation                │
│ HUD · Canvas/WebGL · Input · Camera · Audio │
└──────────────────────┬──────────────────────┘
                       │ commands / snapshots
┌──────────────────────▼──────────────────────┐
│                Game Application             │
│ Missions · progression · orchestration      │
│ tutorial · pause/time scale · save/load     │
└──────────────────────┬──────────────────────┘
                       │ state transitions
┌──────────────────────▼──────────────────────┐
│                Simulation Core              │
│ Sailing · wind · currents · navigation      │
│ weather · ship · crew · supplies · time     │
└──────────────────────┬──────────────────────┘
                       │ queries
┌──────────────────────▼──────────────────────┐
│                  World Model                │
│ Geography · fields · ports · discoveries    │
│ scenario definitions · historical content   │
└──────────────────────┬──────────────────────┘
                       │ persistence adapters
┌──────────────────────▼──────────────────────┐
│                Infrastructure               │
│ Local storage · files · optional backend    │
│ cloud saves · accounts · leaderboards       │
└─────────────────────────────────────────────┘
```

Dependencies should point downward. The simulation core must never import UI code.

## Current MVP mapping

The repository currently has a deliberately lightweight structure:

- `src/simulation.ts` contains the beginning of the simulation core.
- `src/main.ts` currently combines application orchestration, rendering and parts of input handling.
- `src/telemetry-ui.ts` augments the presentation layer.
- `src/camera-ui.ts` owns map viewport interaction.
- CSS files provide presentation only.

This is acceptable for the MVP, but `main.ts` should progressively shrink as systems become substantial.

## Recommended future structure

```text
src/
  app/
    game-controller.ts
    mission-controller.ts
    save-controller.ts

  simulation/
    world-state.ts
    step-world.ts
    sailing.ts
    wind.ts
    currents.ts
    weather.ts
    navigation.ts
    exploration.ts
    ship.ts
    crew.ts
    supplies.ts

  world/
    coordinates.ts
    geography.ts
    world-query.ts
    scenario.ts
    data/

  presentation/
    render/
    hud/
    camera/
    input/
    telemetry/

  persistence/
    local-save.ts
    serialization.ts

  shared/
    math.ts
    types.ts
```

Do not perform this refactor merely for folder aesthetics. Split modules when responsibilities become meaningfully independent.

## Simulation model

### Fixed world state

The simulation should evolve through explicit state transitions:

```ts
nextState = stepWorld(previousState, dt, playerCommands)
```

Avoid hidden mutable global simulation state.

### Fixed timestep

The long-term simulation should use a fixed logical timestep independent of rendering frame rate. Rendering may interpolate between simulation states.

Benefits:

- deterministic tests;
- reproducible voyages;
- stable time acceleration;
- easier replay/debugging;
- independence from device frame rate.

### Determinism

Any stochastic systems such as weather variation should use explicit seeded random generators. A save should include the seed/state required to reproduce future simulation behavior.

### Dynamic weather

Weather belongs to the world/simulation boundary, not the UI. Background environmental providers provide monthly prevailing wind and current. A deterministic, spatially coherent synoptic layer can advect broad ordinary-weather anomalies across the prevailing wind before explicit basin-level weather systems contribute their local wind/current influence; the application may disable this ordinary-weather layer through a persisted player setting without disabling the underlying climatology or explicit weather systems; local systems such as the Strait of Magellan may then channel that result. Rendering may show discovered conditions and system centres, but must not define, mutate or reveal undiscovered weather truth. The exact regime ranges, basin profiles and gameplay simplifications are documented in [SEAS_AND_WEATHER.md](./SEAS_AND_WEATHER.md).

## Coordinates and units

This is the highest-priority foundational cleanup after the MVP.

### Separate coordinate spaces

Elcano should explicitly distinguish:

1. **Geographic/world coordinates** — persistent location in the simulated world.
2. **Projected map coordinates** — coordinates used to render geographic space on a 2D chart.
3. **Screen coordinates** — pixels in the current viewport.
4. **Ship-local coordinates** — bow/starboard-relative vectors used for forces and instrumentation.

No gameplay system should depend directly on screen pixels.

### Nautical heading convention

Adopt one convention throughout the simulation:

- `0°` = North
- `90°` = East
- `180°` = South
- `270°` = West
- headings increase clockwise

Rendering adapters may convert this into mathematical angles as needed.

### Wind convention

Store and document whether wind direction means where wind comes **from** or travels **toward**. Prefer meteorological `from` bearings for user-facing displays, with vector conversion at the simulation boundary.

### Units

Use explicit physical units where possible:

- distance: nautical miles;
- speed: knots;
- time: hours/seconds as explicitly named quantities;
- geographic coordinates: latitude/longitude or a documented projected world system.

Avoid unlabeled arbitrary values leaking into gameplay calculations.

## World-query architecture

Simulation systems should query the environment rather than own it:

```ts
windAt(position, time)
currentAt(position, time)
depthAt(position)
weatherAt(position, time)
```

This allows the underlying implementation to evolve from simple analytic fields to raster/vector geographic data without changing ship logic.

## World truth vs player knowledge

The game should maintain two distinct concepts:

### World truth

The simulation's actual state:

- geography;
- weather;
- currents;
- ports;
- hazards;
- hidden locations.

### Player knowledge

What has been observed, charted or reported:

- explored areas;
- known coastline;
- estimated current/wind patterns;
- discovered ports;
- uncertain position;
- outdated information.

Rendering should normally derive the chart from player knowledge, not directly from world truth.

This separation enables meaningful exploration and navigation uncertainty.

## Sailing model

Keep the sailing model interpretable rather than pursuing CFD-level realism.

A useful abstraction is:

```text
velocity over ground
  = velocity through water
  + ocean current
```

`velocity through water` depends on:

- ship type;
- heading relative to wind;
- wind strength;
- sail configuration;
- damage/loading/weather modifiers.

Represent ship performance with polar curves or equivalent data-driven functions.

## Camera and rendering

The map camera is presentation state only. It must not modify world coordinates.

Camera responsibilities:

- world → screen transforms;
- zoom;
- pan;
- viewport bounds;
- off-screen indicators;
- pointer/touch conversion from screen → world.

The current `camera-ui.ts` is an initial implementation of this boundary.

## Input

Normalize touch, mouse and keyboard interactions into semantic commands before they reach game logic.

Examples:

```text
SetRudder(-10°)
SetSailArea(75%)
SetTimeScale(4)
PanCamera(dx, dy)
ZoomCamera(anchor, factor)
```

Camera commands remain in presentation; sailing commands go to the application/simulation layer.

## Data-driven content

Scenarios should eventually be external definitions rather than hard-coded in `main.ts`.

A scenario may define:

- starting ship and position;
- date/time;
- destination/objectives;
- available knowledge/maps;
- weather/current dataset or seed;
- historical context;
- tutorial triggers;
- victory/failure conditions.

Ships should similarly define polar/performance data, cargo capacity and other characteristics as data.

## Persistence

Core saves should be serializable locally in the browser.

A save should contain only durable game state, not UI implementation details.

Potential contents:

- version/schema;
- simulation state;
- scenario ID;
- deterministic RNG state;
- player knowledge;
- progression;
- optional camera state.

Schema migrations should be introduced once saves are expected to survive releases.

The current expedition persistence adapter is browser-local and versioned. It stores only player knowledge (the existing exploration-cell keys) and completed-voyage summaries; it never stores hidden environmental truth or arbitrary live simulation state. Storage failures are non-fatal and save writes are debounced.

## Optional backend

A backend may later provide:

- accounts;
- cloud save synchronization;
- shared expeditions;
- leaderboards;
- telemetry/analytics;
- content distribution.

The simulation must remain executable without these services.

## Testing strategy

Prioritize deterministic simulation tests over screenshot-heavy UI tests.

Useful test categories:

- sailing polar behavior at key wind angles;
- vector composition of sail velocity and current;
- heading/bearing conversions;
- coordinate transforms;
- deterministic world stepping;
- scenario completion conditions;
- serialization round trips;
- camera world/screen transform invariants.

For UI changes, verify both desktop and mobile behavior, especially touch gestures and viewport overlays.

## Performance

Do not prematurely optimize the MVP. When the world becomes larger:

- query/render only visible geographic regions;
- spatially index world objects;
- cache environmental samples where appropriate;
- move expensive deterministic simulation work to a Web Worker if profiling justifies it;
- keep rendering frame rate separate from simulation update rate.

## Architectural decision rule

When choosing between two implementations, prefer the one that keeps the simulation understandable and reusable independently of the UI.
