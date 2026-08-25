# Future Features & Ideas

Elcano should stay simple. New features should strengthen the core loop: choose a ship, read the wind and currents, pick a route, and complete a voyage.

## 1. Real-world map

Replace the abstract 1000×650 test world with real geography.

- Use real coastlines and islands.
- Use geographic coordinates rather than abstract canvas coordinates.
- Keep the existing sailing simulation and controls layered on top of the map.
- Start with a practical data source such as static GeoJSON / Natural Earth-style coastline data.
- Only introduce a live map API or tile service if it clearly improves labels, detail, terrain, or usability.
- Keep the app static-first and avoid making the core simulation dependent on a server.

The player should eventually be able to navigate the real Atlantic and, later, the wider world.

## 2. Small ship roster

Add roughly four or five selectable historical ship presets.

Possible examples:

- Caravel — light, agile, comparatively good at tighter wind angles.
- Nao / carrack — balanced exploration ship.
- Galleon — heavier and less agile, but strong with favorable winds.
- Lateen-focused vessel — strong across and into the wind.
- Square-rigged vessel — strongest with following winds, weaker upwind.

Avoid large stat sheets. The main gameplay difference should be how each ship sails relative to the wind.

## 3. Rig and sail types

Ship behavior should be driven mainly by hull + rig.

- Square sails: strong downwind performance, poorer ability to sail close to the wind.
- Triangular / lateen sails: better performance at tighter wind angles, somewhat less dominant directly downwind.
- Mixed rigs can sit between those extremes.

Represent this with simple polar curves rather than complex sail simulation.

The player should feel the difference immediately by choosing different headings in the same wind.

## 4. Historical expeditions and missions

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

The player should not have to reproduce the historical route exactly. The interesting part is trying their own route under similar geographic and sailing constraints.

A completed mission may optionally compare the player's route with the historical route.

## 5. Near-term implementation order

1. Replace the abstract map with real-world geographic data.
2. Convert the simulation/world layer from abstract x/y coordinates to a geographic projection and latitude/longitude-aware model.
3. Preserve the existing camera: width-fitted initial view, pan, pinch/wheel zoom, and off-screen objective arrows.
4. Add one real historical route as the first mission.
5. Introduce a small data-driven ship/rig model with two contrasting sail plans first: square and lateen.
6. Expand to roughly four or five ship presets only after those first two clearly feel different.

## Scope rule

Do not add crew management, supplies, trading, RPG progression, detailed damage systems, politics, combat, or other large subsystems unless the direction of the game changes explicitly later.

The intended game remains primarily about **real-world sailing navigation, winds, currents, ship/rig choice, and historical voyages**.
