import './weather-forecast.css';
import { currentAt, windAt } from './world/environment';
import { greatCircleDistanceNm, project, type EastNorthVector, type GeoPosition } from './world/coordinates';
import { isWorldPointExplored } from './exploration';
import { globalWeatherSystems, type WeatherSystem } from './world/weather';
import type { WorldState } from './simulation';

type ForecastState = Pick<WorldState, 'time' | 'destination'> & { ship: Pick<WorldState['ship'], 'position'> };

const FORECAST_HOURS = [0, 12, 24, 48] as const;
const NEARBY_STORM_NM = 700;

function magnitude(vector: EastNorthVector) {
  return Math.hypot(vector.x, vector.y);
}

function bearing(vector: EastNorthVector) {
  return (Math.atan2(vector.x, vector.y) * 180 / Math.PI + 360) % 360;
}

function direction(vector: EastNorthVector) {
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return names[Math.round(bearing(vector) / 45) % names.length];
}

function timeAt(time: Date, hours: number) {
  return new Date(time.getTime() + hours * 3_600_000);
}

function formatWind(position: GeoPosition, time: Date) {
  const vector = windAt(position, time);
  return `${magnitude(vector).toFixed(0)} kn ${direction(vector)}`;
}

function formatCurrent(position: GeoPosition, time: Date) {
  const vector = currentAt(position, time);
  return `${magnitude(vector).toFixed(1)} kn ${direction(vector)}`;
}

function knownNearbyStorms(position: GeoPosition, time: Date) {
  return globalWeatherSystems(time)
    .filter((storm) => isWorldPointExplored(project(storm.center)))
    .map((storm) => ({ storm, distanceNm: greatCircleDistanceNm(position, storm.center) }))
    .filter(({ distanceNm }) => distanceNm <= NEARBY_STORM_NM)
    .sort((a, b) => a.distanceNm - b.distanceNm)
    .slice(0, 2);
}

function futureStorm(storm: WeatherSystem, time: Date, hours: number) {
  return globalWeatherSystems(timeAt(time, hours)).find((candidate) => candidate.id === storm.id);
}

function stormSummary(storm: WeatherSystem, time: Date) {
  const future = futureStorm(storm, time, 12);
  if (!future) return `${storm.intensity} low weakening`;
  const movement = {
    x: (future.center.lon - storm.center.lon) * 60 * Math.max(.2, Math.cos(storm.center.lat * Math.PI / 180)),
    y: (future.center.lat - storm.center.lat) * 60,
  };
  return `${storm.intensity} · moving ${direction(movement)} ${Math.round(magnitude(movement) / 12)} kn`;
}

function trend(position: GeoPosition, time: Date) {
  const now = magnitude(windAt(position, time));
  const later = magnitude(windAt(position, timeAt(time, 24)));
  const difference = later - now;
  if (difference > 3) return `Wind strengthens by about ${Math.round(difference)} kn over the next day.`;
  if (difference < -3) return `Wind eases by about ${Math.round(-difference)} kn over the next day.`;
  return 'Wind stays broadly steady over the next day.';
}

/** Presentation adapter: the forecast reads deterministic world queries but only
 * presents the ship's already-observed position and storm centres discovered on
 * the chart. */
export function installWeatherForecast(getState: () => ForecastState) {
  const modal = document.createElement('div');
  modal.className = 'weather-forecast-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="weather-forecast-backdrop"></div>
    <section class="weather-forecast-card" role="dialog" aria-modal="true" aria-labelledby="weather-forecast-title">
      <button class="weather-forecast-close" type="button" aria-label="Close forecast">×</button>
      <p class="weather-forecast-kicker">Known waters · 48 hours</p>
      <h2 id="weather-forecast-title">Sailing forecast</h2>
      <p class="weather-forecast-intro">Forecasts use your current position and only storm centres you have already charted. Wait at anchor when conditions are not worth forcing.</p>
      <div class="weather-forecast-trend" data-forecast-trend></div>
      <div class="weather-forecast-grid" data-forecast-grid></div>
      <section class="weather-forecast-storms" data-forecast-storms></section>
    </section>
  `;
  document.body.appendChild(modal);

  const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
  const render = () => {
    const state = getState();
    const { position } = state.ship;
    modal.querySelector<HTMLElement>('[data-forecast-trend]')!.textContent = trend(position, state.time);
    modal.querySelector<HTMLElement>('[data-forecast-grid]')!.innerHTML = FORECAST_HOURS.map((hours) => {
      const sampleTime = timeAt(state.time, hours);
      return `<article class="weather-forecast-sample"><strong>${hours === 0 ? 'Now' : `+${hours} h`}</strong><span>Wind ${formatWind(position, sampleTime)}</span><span>Current ${formatCurrent(position, sampleTime)}</span></article>`;
    }).join('');

    const storms = knownNearbyStorms(position, state.time);
    modal.querySelector<HTMLElement>('[data-forecast-storms]')!.innerHTML = storms.length
      ? `<h3>Known nearby systems</h3>${storms.map(({ storm, distanceNm }) => `<p><span aria-hidden="true">🌩️</span> ${Math.round(distanceNm)} nm away · ${stormSummary(storm, state.time)}</p>`).join('')}`
      : '<h3>Known nearby systems</h3><p>No charted storm centre within 700 nm.</p>';
  };
  const open = () => { render(); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); };

  modal.querySelector('.weather-forecast-close')!.addEventListener('click', close);
  modal.querySelector('.weather-forecast-backdrop')!.addEventListener('click', close);
  window.addEventListener('elcano:open-weather-forecast', open);
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) close(); });
}
