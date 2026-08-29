# Seas, Winds, Currents & Weather

This is Elcano's gameplay reference for the world's major sailing regions. It distinguishes real climatological patterns from the deliberately readable, deterministic weather model used by the game.

## How to read this document

- **Prevailing winds and currents** come from monthly modern reference fields: CCMP V2 10 m winds and OSCAR surface currents (with a high-resolution Bay of Biscay wind/current field). They represent plausible modern climatology for a mission month, not literal weather in the 1500s.
- Wind arrows in Elcano show where air travels **toward**. They are not meteorological “wind from” bearings.
- **Storm systems** are procedural gameplay systems. Their locations, intensity and movement are deterministic from simulation time, so a given voyage remains reproducible.
- The simplified systems below represent the large-scale storm belts and tropical-cyclone seasons. They are not a weather forecast and do not simulate fronts, pressure gradients, tides, waves, or land effects yet.

## Environmental composition

```text
local wind    = monthly prevailing wind + weather-system wind
local current = monthly background current + small weather-driven deflection
```

Storms principally alter wind. Their current effect is only 0.8% of their local rotating wind contribution, preserving major ocean-current structure.

## Global circulation at a glance

| Latitude | Typical wind belt | Navigation character |
|---|---|---|
| 0–5° | Intertropical convergence zone / doldrums | Variable and often light winds; avoid assuming dependable progress. |
| 5–30°N | Northeast trades | Broadly toward the southwest/west. |
| 30–60°N | Westerlies | Broadly toward the east; North Atlantic and North Pacific lows travel here. |
| 5–30°S | Southeast trades | Broadly toward the northwest/west. |
| 30–60°S | Roaring Forties / Southern Ocean westerlies | Strong eastbound flow and the game's stormiest major belt. |

## Basin profiles

| Region | Prevailing wind/current character | Dynamic systems in Elcano |
|---|---|---|
| North Atlantic | Trades in the subtropics; westerlies north of them. North Atlantic gyre, Gulf Stream/North Atlantic Drift and Canary Current shape currents. | A year-round eastbound mid-latitude low; stronger in northern winter. |
| South Atlantic | Southeast trades north of the subtropical high; strong westerlies toward Patagonia. Brazil, Benguela and South Atlantic currents form the gyre. | A south-Atlantic low plus Southern-Ocean influence; strongest in austral winter. Tropical cyclones are not generated here. |
| North Pacific | Trades in the subtropics; vigorous westerly storm track farther north. Kuroshio, North Pacific Drift and California Current shape the gyre. | Two year-round eastbound mid-latitude lows, strongest in northern winter; a western-Pacific typhoon system can occur year-round. |
| East Pacific | Northeast trades and the California Current in the north; tropical eastward/westward variations near Central America. | Tropical cyclone system only June–November, moving broadly west before later recurvature is modelled. |
| North Indian Ocean | Monsoon reversal is important: southwest monsoon in boreal summer and northeast monsoon in winter. Currents reverse with it. | Tropical system only in the pre- and post-monsoon windows: April–May and October–December. |
| Southwest Indian Ocean | Southeast trades and subtropical gyre; Agulhas Current is the dominant southwest-bound boundary current near Africa. | Tropical cyclones during November–April, moving broadly west/southwest in the initial model. |
| Australian / Southeast Indian | Trade-wind and monsoonal region north of Australia; Leeuwin and broader subtropical circulation affect surface flow. | Tropical cyclones November–April. |
| South Pacific | Southeast trades and South Pacific gyre; stronger westerlies south of about 30°S. | Tropical cyclones November–April, especially in the southwest tropical Pacific. |
| Southern Ocean | Persistent, fast eastward westerlies and the Antarctic Circumpolar Current. | Two fast, year-round eastbound low-pressure tracks; strongest in austral winter. |

## Storm model

Every generated system is a low-pressure circulation:

- counter-clockwise north of the Equator and clockwise south of it;
- visibly marked as 🌩️ only when its centre is in discovered water;
- calm at the centre;
- gradually stronger from the centre to a broad peak-wind ring at 70% of its radius;
- sharply weaker between that ring and the outer edge;
- moving through its basin on a deterministic track, usually about 10–13 kn eastward for mid-latitude lows.

### Intensity classes

| Class | Added wind at the peak ring | Meaning in the game |
|---|---:|---|
| Ordinary low | 10–18 kn | Bends, reinforces, or locally cancels prevailing wind. |
| Gale | 18–30 kn | Often dominates the local wind direction. |
| Severe storm | 30–40 kn | Overcomes the prevailing field over much of its peak ring. |

The displayed local wind is the vector sum of the background field and that rotating contribution. Consequently, one side of a storm may have dramatically strengthened winds while the opposite side can be calm or reversed.

## What is deliberately not modelled yet

- high-pressure systems and fronts;
- storm formation, dissipation and recurvature based on live atmospheric physics;
- tides, coastal jets and terrain-driven wind;
- waves, swell, rain, visibility or ship damage;
- historical uncertainty: discovered water currently shows the live simulated field rather than a stale observation.

These omissions are intentional. Elcano currently prioritizes legible route decisions and a deterministic, static-first sailing simulation.
