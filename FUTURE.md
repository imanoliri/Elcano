# Future Features & Ideas

Elcano should stay simple. New features should strengthen the core loop: choose a ship, read the wind and currents, pick a route, and complete a voyage.

## 1. Real-world map

Replace the abstract test world with real geography.

- Use real coastlines and islands.
- Use geographic coordinates rather than abstract canvas coordinates.
- Keep the existing sailing simulation and controls layered on top of the map.
- Keep geography static-first and progressively increase coastline detail with zoom.
- Add sparse real-world coastline, port, island and sea labels that appear by zoom level.
- Add a nautical-mile scale bar that updates with zoom.
- Add optional compass/cardinal ticks at useful zoom levels.
- Add tap/click measurement: distance and bearing from the ship to a chosen map point.
- Add a follow-ship / recenter control after the player pans away.

The player should eventually be able to navigate the real Atlantic and the wider world.

## 2. Environmental navigation

- [x] Load real-world environment tiles beyond the Bay of Biscay only around the visible map area, with caching and a deterministic fallback when remote data is unavailable.
- Add separate wind/current visibility toggles.
- Add a thin course trail showing the ship's actual travelled path.
- Add an optional bearing-to-target reference line so desired bearing can be compared with heading and track.
- Add deterministic day-to-day wind variation around the monthly climatology so voyages encounter plausible calms, stronger winds and directional shifts while remaining reproducible and static-first. Preserve the climatological mean direction and scalar wind-speed distribution rather than simply adding random noise.
- Keep historical missions explicit that modern observed/reanalysis data represents plausible prevailing conditions, not literal weather from the 16th century.

## 3. Small ship roster

Add roughly four or five selectable historical ship presets.

Possible examples:

- Caravel — light, agile, comparatively good at tighter wind angles.
- Nao / carrack — balanced exploration ship.
- Galleon — heavier and less agile, but strong with favorable winds.
- Lateen-focused vessel — strong across and into the wind.
- Square-rigged vessel — strongest with following winds, weaker upwind.

Avoid large stat sheets. The main gameplay difference should be how each ship sails relative to the wind.

## 4. Rig and sail types

Ship behavior should be driven mainly by hull + rig.

- Square sails: strong downwind performance, poorer ability to sail close to the wind.
- Triangular / lateen sails: better performance at tighter wind angles, somewhat less dominant directly downwind.
- Mixed rigs can sit between those extremes.

Represent this with simple polar curves rather than complex sail simulation.

The player should feel the difference immediately by choosing different headings in the same wind.

## 5. Historical expeditions and missions

Build missions on top of the real-world map.

Each mission can remain simple:

- historical start position;
- one or more destinations;
- chosen ship / rig;
- prevailing winds and currents;
- objective such as reaching the destination efficiently.

Possible expeditions include:

- Magellan–Elcano;
- Columbus;
- Vasco da Gama;
- Cabral;
- shorter regional or Atlantic navigation challenges.

For the Magellan–Elcano route, later stages can naturally follow A Coruña toward the Canary Islands, Cape Verde, the Atlantic crossing, Strait of Magellan, Pacific and Moluccas.

The player should not have to reproduce the historical route exactly. The interesting part is trying their own route under similar geographic and sailing constraints.

A completed mission may optionally compare the player's route with the historical route.

## 6. Navigation rules

- Add coastline collision / grounding so ships cannot simply sail across land.
- Keep grounding simple: stop or strongly reduce movement rather than introducing a damage subsystem.

## 7. Near-term implementation order

1. Course trail.
2. Coastline collision / grounding.
3. Sparse map labels and nautical scale bar.
4. Harden global environment tiling and caching for long voyages.
5. Introduce two contrasting rig plans: square and lateen.
6. Expand to roughly four or five ship presets only after those first two clearly feel different.
7. Continue the historical expedition beyond A Coruña.

## Scope rule

Do not add crew management, supplies, trading, RPG progression, detailed damage systems, politics, combat, or other large subsystems unless the direction of the game changes explicitly later.

The intended game remains primarily about **real-world sailing navigation, winds, currents, ship/rig choice, and historical voyages**.
