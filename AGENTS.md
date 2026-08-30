# AGENTS.md

This file defines how AI coding agents should work in the Elcano repository.

## Project objective

Elcano is a browser-based Age-of-Sail navigation and exploration game. The core gameplay is choosing routes through wind, currents, uncertain information and geography.

Do not turn Elcano into a generic arcade boat game. Route planning and understanding the sea are the primary mechanics.

## Core architectural rule

> The simulation must remain independent from the UI.

Do not put new game rules directly into rendering code when they can live in simulation or application modules.

The browser UI may visualize, control and inspect the simulation, but it should not become the source of truth for world state.

Read `ARCHITECTURE.md` before making structural changes.

## Branch and Git rules

- `main` is production.
- Do not push feature work directly to `main` unless explicitly instructed.
- Work on the branch specified by the user/task.
- When modifying an existing file through automation, fetch the current version/SHA first.
- Do not overwrite unrelated changes.
- Keep commits scoped and descriptive.
- Do not merge a PR unless explicitly instructed.
- When a pull request is connected to Netlify, pushing a new commit to the PR branch automatically triggers a new Netlify deploy preview. Do not manually trigger an extra Netlify deploy unless the automatic integration fails or the user explicitly asks for one.
- When deployment matters, verify the current deploy/status rather than assuming a push succeeded.

## Development commands

```bash
npm install
npm run dev
npm run build
```

Before considering implementation work complete, `npm run build` should pass when a runnable environment is available.

If the build cannot be executed because of environment/network limitations, state that clearly rather than claiming success.

## Current stack

- TypeScript
- Vite
- HTML/CSS
- Canvas-based world rendering
- Netlify static deployment

Avoid adding a framework or backend without a concrete need.

## Code organization

Current MVP files include:

```text
src/main.ts
src/simulation.ts
src/telemetry-ui.ts
src/camera-ui.ts
src/style.css
src/telemetry-ui.css
src/camera-ui.css
```

The current layout is intentionally lightweight. As systems grow, move toward the boundaries documented in `ARCHITECTURE.md` rather than expanding `main.ts` indefinitely.

## Simulation rules

### Keep simulation state explicit

Prefer functions of the form:

```ts
nextState = stepWorld(state, dt, commands)
```

over hidden mutable state.

### Use meaningful units

Do not introduce new arbitrary speed/distance/time values without documenting their meaning.

The intended long-term conventions are:

- nautical miles for distance;
- knots for speed;
- explicit time units;
- nautical headings: 0° north, 90° east, clockwise positive.

Existing MVP code may still contain legacy abstract units. Do not silently reinterpret them; migrate deliberately.

### Environmental queries

Prefer world-query functions such as:

```ts
windAt(position, time)
currentAt(position, time)
weatherAt(position, time)
```

Ship behavior should consume environmental data instead of embedding world definitions inside ship code.

### Determinism

Where randomness is introduced, use explicit seeds/state so voyages can eventually be replayed and tested.

## World truth vs player knowledge

Preserve the conceptual distinction between:

- what actually exists in the world;
- what the player currently knows or has charted.

Fog-of-war, discovered geography, uncertain currents and navigation information belong to player knowledge.

Do not expose hidden world truth through UI merely because the simulation has access to it.

## Sailing model

The core relationship should remain understandable:

```text
velocity over ground
  = sailing velocity through water
  + ocean current
```

Sailing velocity should depend on wind relative to the ship and, later, ship polar/performance data.

Favor interpretable approximations over opaque complexity.

## UI and interaction rules

### Mobile first

Every major interaction must work on a phone.

For map interaction:

- mouse drag and touch pan should behave consistently;
- mouse wheel/trackpad and pinch should zoom around the interaction point;
- controls must not accidentally trigger camera gestures;
- preserve aspect ratio and world/screen coordinate correctness.

### Camera is presentation state

Panning and zooming must not alter world coordinates or simulation state.

Convert between world and screen coordinates explicitly.

### Instrumentation

Telemetry should help the player understand the simulation.

Prefer showing meaningful physical relationships such as:

- heading;
- course/track;
- wind;
- current;
- apparent wind;
- slip/drift;
- speed.

Avoid decorative indicators with no reliable relation to the underlying model.

## UX philosophy

Elcano should teach through interaction rather than through dense explanation.

Good UI:

- exposes cause and effect;
- makes navigation decisions legible;
- lets players compare route choices;
- supports experimentation with time acceleration;
- works with minimal text during normal play.

Do not add unnecessary modal flows or menus to simple interactions.

## Historical content

Historical inspiration should support gameplay, not overwhelm it.

When adding historical ships, routes, expeditions or geography:

- distinguish known historical facts from gameplay abstractions;
- avoid presenting invented details as historical fact;
- make abstractions explicit in code/data when relevant.
- Keep campaigns data-driven in `src/missions.ts`: each playable leg needs a date/context, briefing, completion text and a historical note that identifies compressed or approximate geography.

## Scope discipline

When implementing a task:

1. solve the requested behavior first;
2. avoid unrelated refactors unless needed for correctness;
3. preserve existing gameplay/UI unless the task requires changing it;
4. prefer small composable additions over rewriting working systems;
5. if a foundational inconsistency blocks the task, document it and make the smallest clean fix.

## Testing expectations

At minimum, reason about or test:

- desktop interaction;
- phone/touch interaction;
- resize/orientation changes;
- simulation behavior at time acceleration;
- coordinate edge cases;
- off-screen UI indicators;
- save/state compatibility when persistence is touched.

For simulation changes, add deterministic unit tests once a test harness exists.

## Avoid

- coupling simulation logic to DOM elements;
- using CSS transforms as game-state coordinates;
- silently changing heading/wind conventions;
- introducing backend dependencies for core gameplay;
- adding heavy libraries for simple vector/math problems;
- manually triggering Netlify deploys for a PR branch when a normal branch push already triggers the deploy preview;
- assuming Netlify deployed successfully without checking;
- claiming work was performed or validated when it was not.

## Definition of done

A change is done when:

- the requested behavior is implemented;
- unrelated behavior remains intact;
- TypeScript/build validation passes when executable;
- relevant desktop/mobile behavior has been considered;
- the branch contains the changes;
- deployment status is verified when the task depends on a deploy.
