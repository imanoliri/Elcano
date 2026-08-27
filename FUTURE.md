# Future Features & Ideas

Elcano should stay simple. New features should strengthen the core loop: choose a ship, read the wind and currents, pick a route, and complete a voyage.

## 1. Real-world map

Replace the abstract test world with real geography.

- [x] Use real coastlines and islands.
- [x] Use geographic coordinates rather than abstract canvas coordinates.
- [x] Keep the existing sailing simulation and controls layered on top of the map.
- Keep geography static-first and progressively increase coastline detail with zoom.
- Add sparse real-world coastline, port, island and sea labels that appear by zoom level.
- Add a nautical-mile scale bar that updates with zoom.
- Add optional compass/cardinal ticks at useful zoom levels.
- Add tap/click measurement: distance and bearing from the ship to a chosen map point.
- [x] Add a two-state camera control: static camera or follow ship. Static preserves the current view; follow keeps the ship centered while allowing zoom.

### Future map-label architecture

The current label layer intentionally uses one centralized label list with zoom thresholds, priorities and collision suppression. Keep that simple architecture for now. If several more historical campaigns make the list unwieldy, refactor the data without changing the renderer: separate global geography from campaign-specific label packs, allow labels to declare one or more campaign IDs, and derive primary mission start/destination labels automatically from campaign mission definitions so mission coordinates are not duplicated manually.

The player should eventually be able to navigate the real Atlantic and the wider world.

## 2. Environmental navigation and weather visualization

- [x] Load real-world environment tiles beyond the Bay of Biscay only around the visible map area, with caching and a deterministic fallback when remote data is unavailable.
- Add separate wind/current visibility toggles.
- Improve map-readable wind systems with optional wind arrows, streamlines or a compact weather overlay.
- [x] Add a thin course trail showing the ship's actual travelled path.
- [x] Add two forward navigation vectors at the ship: a heading vector showing where the bow is pointed and a track/course-over-ground vector showing the actual direction of movement. Their angular difference is the ship's slip/drift angle.
- Keep an optional bearing-to-target reference line as a separate future aid so desired bearing can be compared with heading and track without confusing it with either vector.
- Add deterministic day-to-day wind variation around the monthly climatology so voyages encounter plausible calms, stronger winds and directional shifts while remaining reproducible and static-first. Preserve the climatological mean direction and scalar wind-speed distribution rather than simply adding random noise.
- Keep historical missions explicit that modern observed/reanalysis data represents plausible prevailing conditions, not literal weather from the 16th century.

## 3. Small ship roster and rig selection

Add roughly four or five selectable historical ship presets. This is a high-value next sailing feature because the existing polar model can make each rig feel meaningfully different without adding more controls.

Possible examples:

- Caravel — light, agile, comparatively good at tighter wind angles.
- Nao / carrack — balanced exploration ship.
- Galleon — heavier and less agile, but strong with favorable winds.
- Lateen-focused vessel — strong across and into the wind.
- Square-rigged vessel — strongest with following winds, weaker upwind.

Ship behavior should be driven mainly by hull + rig:

- Square sails: strong downwind performance, poorer ability to sail close to the wind.
- Triangular / lateen sails: better performance at tighter wind angles, somewhat less dominant directly downwind.
- Mixed rigs can sit between those extremes.

Represent this with data-driven polar curves rather than complex sail simulation or branching code. Avoid large stat sheets. The player should feel the difference immediately by choosing different headings in the same wind.

## 4. Historical navigation instruments

Add useful navigation information without turning Elcano into a cockpit simulator.

Possible instruments:

- compass and heading;
- latitude readout;
- ship speed / log;
- distance and bearing measurements;
- simple dead-reckoning support;
- later, historically appropriate instruments where they improve gameplay.

The emphasis should remain on reading the sea and making route decisions, not operating many individual controls.

## 5. Historical campaigns and missions

Historical voyages should be organized as **Campaign → Missions**.

A campaign represents one historical expedition or coherent voyage. Each mission is one playable leg with its own start, destination, date/context, objective and briefing. Long expeditions should therefore become a sequence of manageable sub-missions rather than one enormous uninterrupted sail.

The player should not have to reproduce the historical route exactly. The interesting part is trying their own route under similar geographic and sailing constraints. Completed missions may later compare the player's route, time or distance with the historical route.

### Campaign 0 — Tutorial / Road to the expedition

- **Mission 0: San Sebastián → A Coruña.** Keep the existing tutorial as the introductory mission and historical prelude. It teaches wind, current, helm, sails, coastal navigation and waypoint planning before the historical fleet departs.

### Campaign 1 — Loaísa–Elcano Expedition to the Moluccas (1525–1526)

Build the voyage from A Coruña to the Moluccas as successive playable legs. The campaign should make clear that García Jofre de Loaísa commanded the expedition and Juan Sebastián Elcano served as second-in-command and pilot major; Elcano died during the Pacific crossing before the surviving flagship reached the Moluccas.

Initial mission breakdown:

1. **A Coruña → Canary Islands** — departure of the seven-ship fleet on 24 July 1525 and first Atlantic leg.
2. **Canary Islands → coast of Brazil** — work south along the eastern Atlantic before crossing west.
3. **Brazil → Patagonia** — continue south toward the entrance region of the Strait of Magellan.
4. **Patagonian coast → Strait of Magellan** — approach the difficult strait amid worsening weather.
5. **Passage of the Strait of Magellan** — a dedicated constrained-navigation mission through the strait, reaching the Pacific.
6. **Strait of Magellan → central Pacific** — begin the long Pacific crossing; the fleet fragments in severe weather.
7. **Central Pacific → Marshall Islands** — follow the surviving flagship's westward passage toward the island groups encountered in August 1526.
8. **Marshall Islands → Guam** — continue west to the Marianas.
9. **Guam → Mindanao** — reach the Philippine archipelago.
10. **Mindanao → Moluccas / Tidore** — final approach to the Spice Islands by the surviving expedition.

Mission endpoints are gameplay waypoints representing major historical legs, not a claim that the fleet stopped at every endpoint exactly as represented. Briefings should distinguish documented landfalls from useful geographic subdivision points.

### Later campaigns

Possible future campaigns include:

- Magellan–Elcano first circumnavigation;
- Columbus;
- Vasco da Gama;
- Cabral;
- shorter regional or Atlantic navigation challenges.

## 6. Coastal navigation phase 2

Build on coastline collision, anchoring and manual waypoint routes without adding automatic coast-hugging.

- [x] Prevent normal sailing across land / stop the ship when grounded.
- [x] Add contextual anchoring in coastal water.
- [x] Add manual waypoint route planning and automatic helm following while keeping sails manual.
- [x] Add a direct-destination mode to the same map control: one map tap sets a single autopilot target, and each later tap replaces the previous target. Toggle the control into waypoint mode to append multiple route points instead.
- Allow editing individual waypoints.
- Allow inserting/removing route points without clearing the full route.
- Show route-leg distance and bearing.
- Define a clear waypoint-arrival radius and route completion state.

## 7. Near-term implementation order

1. Wind/current visualization improvements.
2. Historical navigation instruments.
3. Coastal navigation phase 2 route editing.
4. Sparse map labels and nautical scale bar.
5. Continue hardening global environment tiling and caching for long voyages.

## Scope rule

Do not add crew management, supplies, trading, RPG progression, detailed damage systems, politics, combat, or other large subsystems unless the direction of the game changes explicitly later.

The intended game remains primarily about **real-world sailing navigation, winds, currents, ship/rig choice, and historical voyages**.
