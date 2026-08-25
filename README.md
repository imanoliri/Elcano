# Elcano

Static-first sailing exploration game inspired by Juan Sebastián Elcano and the navigational challenges of the Age of Sail.

## Vision

Navigation is the core game. Players must read and exploit winds and ocean currents, manage uncertainty, discover coastlines and routes, and reach expedition objectives. The shortest route is often not the fastest or safest route.

## Architectural principles

- **Static-first**: deploy as a static web application, suitable for Netlify.
- **Browser simulation**: wind, currents, ship movement, exploration and saves run client-side.
- **Simulation/UI separation**: the simulation core must not depend on the rendering framework.
- **Data-driven world**: scenarios, ships, winds, currents and geography should be external data where practical.
- **Optional backend**: accounts, cloud saves, leaderboards or shared expeditions can be added later without changing the core simulation.

## MVP goal

Build a minimal playable prototype that proves one question: **is choosing a route through winds and currents fun?**

The MVP should contain:

- one ship;
- a simple ocean map;
- one destination;
- wind and current vector fields;
- heading control;
- ship movement derived from heading + wind + currents;
- fog-of-war / exploration;
- time acceleration;
- local browser persistence;
- Netlify-ready static deployment.

## Planned layers

```text
UI / Rendering
      │
Game Controller
      │
Simulation Core
 ├─ sailing
 ├─ wind
 ├─ currents
 ├─ navigation
 └─ exploration
      │
Scenario / World Data
```

The first implementation lives on the `mvp` branch until it is ready to merge.
