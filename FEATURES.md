# Elcano Feature Atlas

This is the inventory of features that are currently implemented in Elcano. It describes what a player can use now, rather than what is planned next. For planned work, see [FUTURE.md](./FUTURE.md).

## Core voyage loop

- Start a historical sailing mission, select a ship, read the chart, then steer and trim sails to reach the destination.
- The simulation combines sailing velocity through the water with ocean current, so the direction the ship travels can differ from the direction its bow points.
- Pause the voyage or run time at 1×, 4×, 8×, or 16×.
- Restart the current mission at any time.
- Complete a mission by reaching its destination, then continue directly to the next mission or return to the voyage menu at the end of a campaign.

## Historical voyages

### Campaign 0: Basque Whaling tutorial

- Starts with the playable San Sebastián → A Coruña introduction and its three contextual sailing lessons.
- Continues as a seasonal North Atlantic route via the Azores, Grand Banks and Red Bay, Labrador, before the return to the Basque coast.
- Frames Red Bay’s sixteenth-century seasonal whaling station as historical context; it does not add whale-hunting gameplay.

### Magellan–Elcano Circumnavigation: 1519–1522

- The first selectable historical campaign, following the first circumnavigation from Sanlúcar de Barrameda back to Spain.
- Sixteen playable legs cover Tenerife, Brazil, Patagonia, the Strait of Magellan, the Pacific, Guam, the Philippines, Tidore, Timor, the Cape of Good Hope and Cape Verde.
- The campaign changes historical leadership in its text at Cebu: Magellan dies after the Cebu stop, while Elcano commands Victoria’s homeward route from Tidore.
- Every mission includes a historical note; long ocean checkpoints are explicitly identified as gameplay subdivisions rather than claimed landfalls.

### Loaísa–Elcano Expedition: To the Moluccas, 1525–1527

- A selectable historical campaign following the westbound route from A Coruña to Tidore.
- Sixteen playable legs, from the departure for La Gomera through the Atlantic, Patagonia, the Strait of Magellan, the Pacific, the Philippines, and the Moluccas.
- Each mission has a start and destination, historical date/context, briefing, destination marker, and completion text.
- The voyage setup and in-game mission menu both allow the player to browse campaigns and choose any available leg.

### Additional historical campaign catalog

- Campaign 3: Vasco da Gama’s India voyage — South Atlantic arc, Cape weather and Indian Ocean monsoons.
- Campaign 4: Urdaneta’s tornaviaje — North Pacific latitude choice and the westerlies to Acapulco.
- Campaign 5: Columbus’s first voyage — trade winds west, islands, then a westerly return.
- Campaign 6: Cabral’s Brazil and India voyage — the broad South Atlantic swing and the Cape route.
- Campaign 7: Zheng He’s Indian Ocean voyages — monsoon-timed navigation from China to East Africa.
- Campaign 8: Drake’s circumnavigation — a stormier global route with the dedicated Strait of Magellan tools.
- Campaign 9: Norse Road to Vinland — cold North Atlantic, fog and coastal navigation; saga geography is clearly qualified.
- Campaign 10: Classical Mediterranean — an explicitly fictionalized Greek-inspired island-navigation route.

Each campaign is fully mission-based, with date/context, briefing, completion copy and a historical note that separates documented locations from gameplay subdivisions.

## Ship choice and sailing

- Choose one of five ship presets before a voyage:
  - Lateen Vessel — upwind specialist.
  - Caravel — agile mixed rig.
  - Nao / Carrack — balanced default.
  - Galleon — heavy, powerful square rig.
  - Square-Rigged Vessel — downwind specialist.
- Each ship has its own data-driven polar performance curve, hull speed, rig description, and sailing strengths.
- An information button on each ship card opens its polar diagram and characteristics.
- The polar diagram has a simple default view and an optional detailed view with more angle and efficiency information.
- The sailing model identifies the current point of sail, including the no-sail/dead-angle zone, close-hauled sailing, reaching, and running.
- Helm control supports port/starboard rudder input and centering; sail control adjusts sail area from furled to full sail.
- Navigation is always selectable during a voyage. Ocean mode keeps the rapid voyage clock (1×, 4×, 8×, 16×); Manoeuvring mode pauses on entry and offers 0.1×, 0.25×, 0.5×, and 1× for confined water, with a more responsive helm.
- In Manoeuvring mode, each vessel has a small ship-type-dependent auxiliary drive when sails are furled or nearly furled and sailing speed is below 1.5 kn. It is enabled by default, shown as **Rowing**, and can be switched off at any time; it is not a replacement for sail power.
- Desktop keyboard controls support both arrow keys and WASD by default: left/right steer, up/down raise or lower sails. `X` drops/raises the contextual coastal anchor, `C` toggles Static ↔ Follow ship camera, `V` toggles Direct ↔ Waypoints navigation mode, and `+`/`−` zoom the chart. They also cover centering the helm, pause/time speeds, restart, instructions, and the mission menu.
- Keyboard bindings can be changed and restored to defaults from the voyage-selection screen or the in-mission menu; they remain saved in the browser.

## Real-world chart and exploration

- The game world uses latitude/longitude positions, real coastlines and islands, and a Web Mercator chart projection.
- Geography is bundled in the static app: no map API or mandatory online map service is required to sail.
- The chart can be panned and zoomed with mouse, touch drag, wheel/trackpad, and pinch gestures.
- Close-pilotage zoom reaches 1024× the fitted-world scale, so straits, harbour approaches and dense island passages can be inspected well beyond the normal ocean view.
- The camera can switch between a static view and follow-ship view.
- The chart wraps continuously at its edges, allowing uninterrupted long-distance exploration rather than stopping at a map boundary.
- Higher-detail coastline geometry loads at close zoom without making normal camera movement heavy.
- Zoom-aware labels identify mission locations, ports, cities, islands, straits, seas, and major ocean regions while suppressing collisions between labels.
- Fog of war hides unexplored waters. Sailing reveals chart cells around the ship, and discovered cells remain charted across later missions and campaigns in this browser.

## Expedition progress and voyage logbook

- Completed missions are remembered locally, with completion date, latest voyage time, best voyage time, distance sailed, selected ship, and a compact sampled route.
- Campaign and mission selectors show completed missions and campaign progress while leaving every mission selectable for replay.
- The Voyage logbook in voyage setup groups completed legs by campaign and makes replay results clear: one mission record has a latest result and best time.
- A deliberate confirmed reset clears expedition records, results, route history, and accumulated chart knowledge; restarting a mission does not.
- The logbook can export or import the entire local expedition as a JSON file through the device’s normal download and file-picker flow.

## Wind, currents, and weather

- Wind and surface-current fields affect sailing across the world.
- The game uses regional climatology plus lazy-loaded global environment tiles when available, with a deterministic fallback so the game remains playable offline.
- Wind and current arrows appear only in waters the player has explored. Once revealed, those chart cells remain known for the voyage.
- Wind and current overlays are independently toggleable from the in-mission menu.
- Arrow density adapts to zoom: close views show a finer field without flooding the chart at world scale.
- Monthly prevailing wind now has deterministic ordinary-weather variation: broad roughly 1,000 nm synoptic anomalies move across the ocean rather than oscillating in place. A primary field and broader slower field define the large pattern, while a weaker ~350 nm faster field keeps tropical trade and monsoon regions visibly evolving over several days.
- The variation follows wind regime rather than using one global random range: trades stay comparatively steady, mid-latitude westerlies vary much more, doldrums are fickle and can become very light, monsoon regions keep their seasonal background direction while varying day to day, and Southern Ocean westerlies keep a strong comparatively stable baseline.
- Speed variation remains centred on the monthly climatological wind and direction shifts remain centred on the prevailing bearing, so repeated ordinary-weather changes do not systematically rotate or weaken the climate.
- **Day-to-day wind variation** can be switched off from the in-mission **Simulation** section. The preference is remembered in the browser; disabling it removes only the ordinary synoptic variation, while monthly prevailing wind and explicit storms remain active.
- Deterministic basin-scale weather systems move through the North and South Atlantic, North Pacific, Southern Ocean, and seasonally active tropical basins.
- Weather systems alter local wind and apply a smaller surface-current influence while persistent large-scale currents remain in place.
- A discovered storm centre is marked on the chart with a storm symbol. Storms have a calm centre, strongest winds in a surrounding ring, and intensity variation from ordinary lows to severe storms.
- Mid-latitude lows now include deterministic warm and cold frontal bands. Cold fronts are narrower and typically extend about 1.7–2.2× the low radius; warm fronts are broader and about 1.25–1.65×. Their weaker outer influence can continue beyond the circular storm edge, so fronts behave as elongated synoptic features rather than being clipped to the low. Tropical cyclones keep the simpler circular model, and all frontal effects remain part of the deterministic simulation rather than the renderer.

## Coastal navigation and route planning

### Strait of Magellan passage

- The dedicated Cape Virgenes → Cape Pillar mission models Primera and Segunda Angostura as strong reversing tidal passages, Paso Tortuoso as a crossing-current hazard, and the remaining Strait as weak-flow water.
- A compact passage-conditions chart uses approximate tide language—slack water, building or strong east/west set—so players can wait for a westbound window without a perfect global forecast.
- Plausible modern westerly/NW winds are channelled through the Strait; Paso Tortuoso can add signalled gusty squalls. Three marked shelter anchorages provide readable places to pause and observe.

- Land collision prevents normal sailing through coastlines and reports whether the ship is in deep water, coastal water, or aground.
- In coastal water, the anchor control can stop the ship in place; raising it resumes normal movement.
- A direct-destination mode lets the player tap the chart to set one autopilot target. A later tap replaces it.
- A waypoint mode lets the player create a multi-leg route while keeping sail trim under manual control.
- Waypoints can be dragged to move them, tapped to remove them, or added by tapping a route leg.
- The route overlay shows the planned path, waypoint markers, and individual leg distance/bearing information.
- The route-planning control can clear the route and return the player to manual navigation.

## Navigation feedback and instruments

- The primary instrument strip shows heading, speed over ground, wind strength and bearing, current strength and bearing, remaining distance, voyage progress, and elapsed days.
- A compass-style heading indicator uses nautical headings.
- The ship-force panel visualizes ship-relative apparent wind, current, and actual track.
- Additional readouts show slip/drift angle, apparent-wind strength and angle, and the current point of sail.
- The chart can show three independently toggleable navigation aids:
  - Heading vector — where the bow is aimed.
  - Track vector — the actual course over ground.
  - Course trail — the path already sailed.
- A clear, one-screen sailing guide explains how wind angle, sails, heading, current, and track relate.

## Mission and interface tools

- A pre-game voyage screen combines campaign selection, mission selection, ship selection, and ship information before launch.
- The in-mission menu provides resume, briefing, sailing guide, restart, previous/next mission, exit to voyage selection, and chart-overlay settings.
- The mission chip opens the current mission instructions.
- An off-screen target indicator points toward the destination when it is outside the visible chart.
- The interface is designed for both desktop and phone-sized touch screens.

## Technical gameplay foundations

- The browser game is static-first and deployable on Netlify without a backend.
- World simulation is deterministic for a given mission/time progression, including the current weather-system model.
- Environmental queries are exposed through wind/current provider boundaries, keeping the sailing simulation separate from map rendering and interface code.
