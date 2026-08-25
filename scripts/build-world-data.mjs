import { writeFile } from 'node:fs/promises';
import { NetCDFReader } from 'netcdfjs';

const WIND_URL = 'https://oceanwatch.pifsc.noaa.gov/erddap/griddap/ccmp-monthly-v2-0.json';
const CURRENT_URL = 'https://ncss.hycom.org/thredds/ncss/grid/GLBu0.08/reanalysis';
const OUTPUT = new URL('../src/world/data/atlantic-climatology.generated.ts', import.meta.url);

const MONTHS = 12;
const SCALE = 100;
const MISSING = -32768;
const MS_TO_KNOTS = 1.9438444924406;

// Tutorial-region coverage with margin around San Sebastián → A Coruña.
const REGION = { minLat: 41, maxLat: 46.5, minLon: -11.5, maxLon: 1 };

function toKnots(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value * MS_TO_KNOTS : Number.NaN;
}

function normalizeLon(lon) {
  return lon > 180 ? lon - 360 : lon;
}

function createGrid(minLat, maxLat, minLon, maxLon, stepDeg, components = 2) {
  const latCount = Math.round((maxLat - minLat) / stepDeg) + 1;
  const lonCount = Math.round((maxLon - minLon) / stepDeg) + 1;
  const length = MONTHS * latCount * lonCount * components;
  return {
    minLat,
    maxLat: minLat + stepDeg * (latCount - 1),
    minLon,
    maxLon: minLon + stepDeg * (lonCount - 1),
    stepDeg,
    latCount,
    lonCount,
    components,
    sum: new Float64Array(length),
    count: new Uint16Array(length),
  };
}

function indexOf(grid, month, latIndex, lonIndex, component) {
  return (((month * grid.latCount + latIndex) * grid.lonCount + lonIndex) * grid.components) + component;
}

function addSample(grid, month, lat, lon, component, value) {
  if (!Number.isFinite(value)) return;
  lon = normalizeLon(lon);
  const latIndex = Math.round((lat - grid.minLat) / grid.stepDeg);
  const lonIndex = Math.round((lon - grid.minLon) / grid.stepDeg);
  if (latIndex < 0 || latIndex >= grid.latCount || lonIndex < 0 || lonIndex >= grid.lonCount) return;
  const expectedLat = grid.minLat + latIndex * grid.stepDeg;
  const expectedLon = grid.minLon + lonIndex * grid.stepDeg;
  if (Math.abs(expectedLat - lat) > grid.stepDeg * 0.55 || Math.abs(expectedLon - lon) > grid.stepDeg * 0.55) return;
  const index = indexOf(grid, month, latIndex, lonIndex, component);
  grid.sum[index] += value;
  grid.count[index] += 1;
}

function pack(grid) {
  const packed = new Int16Array(grid.sum.length);
  for (let index = 0; index < packed.length; index += 1) {
    if (grid.count[index] === 0) packed[index] = MISSING;
    else packed[index] = Math.max(-32767, Math.min(32767, Math.round((grid.sum[index] / grid.count[index]) * SCALE)));
  }
  return Buffer.from(packed.buffer).toString('base64');
}

async function fetchJsonRows(url, query) {
  const response = await fetch(`${url}?${query}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} fetching ${response.url}`);
  const payload = await response.json();
  const names = payload.table.columnNames;
  return payload.table.rows.map((row) => Object.fromEntries(names.map((name, index) => [name, row[index]])));
}

async function buildWindGrid() {
  // CCMP monthly means are native 0.25° vector winds. Use all available years
  // and accumulate them by calendar month to form a monthly climatology.
  const step = 0.25;
  const grid = createGrid(41.125, 46.375, -11.375, 0.875, step);
  const latStart = 478;
  const latEnd = 499;
  // CCMP longitudes are 0.125, 0.375, ... 359.875. Split around Greenwich.
  const westRows = await fetchJsonRows(WIND_URL, `uwnd[0:1:381][${latStart}:1:${latEnd}][1394:1:1439],vwnd[0:1:381][${latStart}:1:${latEnd}][1394:1:1439]`);
  const eastRows = await fetchJsonRows(WIND_URL, `uwnd[0:1:381][${latStart}:1:${latEnd}][0:1:3],vwnd[0:1:381][${latStart}:1:${latEnd}][0:1:3]`);
  for (const row of [...westRows, ...eastRows]) {
    const month = new Date(row.time).getUTCMonth();
    addSample(grid, month, row.latitude, row.longitude, 0, toKnots(row.uwnd));
    addSample(grid, month, row.latitude, row.longitude, 1, toKnots(row.vwnd));
  }
  return grid;
}

function findVariable(reader, candidates) {
  for (const name of candidates) if (reader.dataVariableExists(name)) return name;
  throw new Error(`Missing NetCDF variable; tried ${candidates.join(', ')}`);
}

async function fetchHycomSnapshot(date) {
  const params = new URLSearchParams({
    var: 'water_u,water_v',
    north: String(REGION.maxLat),
    south: String(REGION.minLat),
    west: String(REGION.minLon),
    east: String(REGION.maxLon),
    time: `${date}T00:00:00Z`,
    vertCoord: '0',
    accept: 'netcdf',
    addLatLon: 'true',
  });
  const response = await fetch(`${CURRENT_URL}?${params}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} fetching HYCOM ${date}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const reader = new NetCDFReader(bytes);
  const latName = findVariable(reader, ['lat', 'latitude']);
  const lonName = findVariable(reader, ['lon', 'longitude']);
  const lats = Array.from(reader.getDataVariable(latName));
  const lons = Array.from(reader.getDataVariable(lonName));
  const u = Array.from(reader.getDataVariable('water_u'));
  const v = Array.from(reader.getDataVariable('water_v'));
  return { lats, lons, u, v };
}

async function buildCurrentGrid() {
  // HYCOM GLBu0.08 is a freely available global 1/12° reanalysis on a uniform
  // 0.08° grid. Three representative years are composited by calendar month;
  // this preserves native spatial detail without shipping the global archive.
  const step = 0.08;
  const minLat = 41.04;
  const minLon = -11.44;
  const grid = createGrid(minLat, 46.48, minLon, 0.96, step);
  const years = [2000, 2006, 2012];

  for (let month = 0; month < 12; month += 1) {
    for (const year of years) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-15`;
      const { lats, lons, u, v } = await fetchHycomSnapshot(date);
      const lonCount = lons.length;
      for (let y = 0; y < lats.length; y += 1) {
        for (let x = 0; x < lons.length; x += 1) {
          const sourceIndex = y * lonCount + x;
          addSample(grid, month, lats[y], lons[x], 0, toKnots(u[sourceIndex]));
          addSample(grid, month, lats[y], lons[x], 1, toKnots(v[sourceIndex]));
        }
      }
    }
  }
  return grid;
}

function serializableGrid(grid, packed) {
  return {
    minLat: grid.minLat,
    maxLat: grid.maxLat,
    minLon: grid.minLon,
    maxLon: grid.maxLon,
    stepDeg: grid.stepDeg,
    latCount: grid.latCount,
    lonCount: grid.lonCount,
    months: MONTHS,
    components: grid.components,
    scale: SCALE,
    missing: MISSING,
    packed,
  };
}

async function main() {
  console.log('Building regional 0.25° winds + 0.08° currents…');
  const wind = await buildWindGrid();
  const current = await buildCurrentGrid();
  const data = {
    source: 'CCMP v2 monthly winds + HYCOM GLBu0.08 1/12° current composite',
    generatedAt: 'deterministic-build',
    wind: serializableGrid(wind, pack(wind)),
    current: serializableGrid(current, pack(current)),
  };
  const source = `// Generated by scripts/build-world-data.mjs. Do not edit by hand.\nexport const ATLANTIC_CLIMATOLOGY = ${JSON.stringify(data)} as const;\n`;
  await writeFile(OUTPUT, source, 'utf8');
  console.log(`Wind ${wind.latCount}×${wind.lonCount} @ ${wind.stepDeg}°; current ${current.latCount}×${current.lonCount} @ ${current.stepDeg}°.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
