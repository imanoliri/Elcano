import type { WorldState } from './simulation';

export type Mission = {
  id: string;
  number: number;
  title: string;
  from: string;
  to: string;
  date: string;
  startDateIso: string;
  start: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  headingDeg: number;
  briefing: string;
  completion: string;
  historicalNote: string;
  tutorialSteps?: { title: string; text: string }[];
};

export type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  missions: Mission[];
};

const tutorialMission: Mission = {
  id: 'tutorial-0',
  number: 0,
  title: 'Road to the expedition',
  from: 'San Sebastián',
  to: 'A Coruña',
  date: 'July 1525',
  startDateIso: '1525-07-01T12:00:00Z',
  start: { lat: 43.3183, lon: -1.9812 },
  destination: { lat: 43.3623, lon: -8.4115 },
  headingDeg: 285,
  briefing: 'Sail from San Sebastián to A Coruña and learn to read wind, current, heading and track before joining the historical expedition.',
  completion: 'A Coruña reached. The Loaísa–Elcano fleet is ready to depart for the Moluccas.',
  historicalNote: 'This San Sebastián → A Coruña voyage is a playable tutorial prelude, not a documented leg of the historical expedition. The Loaísa fleet departed A Coruña on 24 July 1525.',
  tutorialSteps: [
    { title: '0.1 Read the Bay of Biscay', text: 'Depart San Sebastián and study the northern Spanish coastline. White arrows show prevailing wind; blue arrows show surface current. A Coruña is your destination on the Galician coast.' },
    { title: '0.2 Make way west', text: 'Set sail and work west across the Bay of Biscay. Do not simply point at A Coruña: compare heading with wind, current and actual track.' },
    { title: '0.3 Approach Galicia', text: 'As you close the Galician coast, adjust your route for the final approach to A Coruña, where the Loaísa–Elcano fleet departed for the Moluccas on 24 July 1525.' },
  ],
};

const loaísaMissions: Mission[] = [
  {
    id: 'loaisa-1', number: 1, title: 'Departure for the Canaries', from: 'A Coruña', to: 'La Gomera', date: '24 July 1525', startDateIso: '1525-07-24T12:00:00Z',
    start: { lat: 43.3623, lon: -8.4115 }, destination: { lat: 28.0916, lon: -17.1133 }, headingDeg: 210,
    briefing: 'Take the seven-ship expedition southwest from A Coruña toward the Canary Islands. This is the first historical leg of the voyage to the Moluccas.',
    completion: 'The fleet has reached the Canary Islands. Prepare for the long descent of the eastern Atlantic.',
    historicalNote: 'The expedition sailed from A Coruña on 24 July 1525 and headed southwest toward the Canary Islands before continuing south along the African side of the Atlantic.',
  },
  {
    id: 'loaisa-2', number: 2, title: 'Cross to Brazil', from: 'Canary Islands', to: 'Brazilian coast', date: 'Late 1525', startDateIso: '1525-09-01T12:00:00Z',
    start: { lat: 28.0916, lon: -17.1133 }, destination: { lat: -22.9, lon: -43.2 }, headingDeg: 220,
    briefing: 'Work south with the Atlantic systems, then turn west for the long ocean crossing to the coast of Brazil.',
    completion: 'South America is in sight. The next challenge is the long run down toward Patagonia.',
    historicalNote: 'After the Canaries the fleet continued south along the African side of the Atlantic and later turned west toward Brazil. The endpoint here is a gameplay subdivision of that broad historical leg, not a claimed exact landfall.',
  },
  {
    id: 'loaisa-3', number: 3, title: 'South to Patagonia', from: 'Brazilian coast', to: 'Patagonia', date: 'November 1525 – January 1526', startDateIso: '1525-11-01T12:00:00Z',
    start: { lat: -22.9, lon: -43.2 }, destination: { lat: -50.0, lon: -68.5 }, headingDeg: 205,
    briefing: 'Follow the South American coast into colder and harsher waters. Reach Patagonia and prepare to find the entrance to Magellan’s passage.',
    completion: 'Patagonia reached. The strait lies ahead.',
    historicalNote: 'The expedition reached the Patagonian region in January 1526 after crossing from the Atlantic side toward South America.',
  },
  {
    id: 'loaisa-4', number: 4, title: 'Find the Strait', from: 'Patagonia', to: 'Cape Virgenes', date: 'January 1526', startDateIso: '1526-01-01T12:00:00Z',
    start: { lat: -50.0, lon: -68.5 }, destination: { lat: -52.33, lon: -68.35 }, headingDeg: 180,
    briefing: 'Navigate the exposed Patagonian coast and identify the eastern entrance of the Strait of Magellan. Weather and coastline now matter more than raw speed.',
    completion: 'The entrance to the Strait of Magellan is ahead.',
    historicalNote: 'Bad weather repeatedly scattered the fleet around the approach to the strait. Ships grounded, were wrecked or became separated during these attempts.',
  },
  {
    id: 'loaisa-5', number: 5, title: 'Through Magellan’s Strait', from: 'Cape Virgenes', to: 'Cape Pillar', date: 'January – May 1526', startDateIso: '1526-01-20T12:00:00Z',
    start: { lat: -52.33, lon: -68.35 }, destination: { lat: -52.72, lon: -74.67 }, headingDeg: 255,
    briefing: 'Make the full westbound passage through the Strait of Magellan. Use manual waypoints and anchoring to negotiate the confined channels safely.',
    completion: 'The Pacific opens ahead. The surviving expedition can begin the ocean crossing.',
    historicalNote: 'After months of difficulty, the diminished fleet finally emerged into the Pacific on 26 May 1526.',
  },
  {
    id: 'loaisa-6', number: 6, title: 'Into the Pacific', from: 'Strait of Magellan', to: 'Central Pacific', date: 'May – July 1526', startDateIso: '1526-05-26T12:00:00Z',
    start: { lat: -52.72, lon: -74.67 }, destination: { lat: -15.0, lon: -135.0 }, headingDeg: 300,
    briefing: 'Leave South America behind and commit to the enormous Pacific crossing. The objective is a broad ocean waypoint rather than landfall.',
    completion: 'You are deep in the Pacific. The surviving flagship must keep westward.',
    historicalNote: 'Severe weather scattered the remaining vessels soon after they entered the Pacific. Loaísa died in July 1526 and Elcano died days later in early August, before the flagship reached the Moluccas.',
  },
  {
    id: 'loaisa-7', number: 7, title: 'Across to the Marshalls', from: 'Central Pacific', to: 'Maloelap region', date: 'August 1526', startDateIso: '1526-08-01T12:00:00Z',
    start: { lat: -15.0, lon: -135.0 }, destination: { lat: 8.75, lon: 171.05 }, headingDeg: 285,
    briefing: 'Continue the westward crossing across a nearly empty ocean. Reach the Marshall Islands region encountered by the surviving flagship.',
    completion: 'The Marshall Islands region has been reached. Guam is the next major landfall.',
    historicalNote: 'The surviving flagship crossed the equator and encountered islands in the Marshall group in August 1526 before continuing toward the Marianas.',
  },
  {
    id: 'loaisa-8', number: 8, title: 'The Marianas', from: 'Marshall Islands', to: 'Guam', date: 'August – September 1526', startDateIso: '1526-08-20T12:00:00Z',
    start: { lat: 8.75, lon: 171.05 }, destination: { lat: 13.4443, lon: 144.7937 }, headingDeg: 275,
    briefing: 'Sail west from the Marshalls to Guam. Longitude wrapping means the shortest visible route may cross the edge of the world map.',
    completion: 'Guam reached. Turn southwest toward the Philippines.',
    historicalNote: 'The Santa María de la Victoria reached Guam on 5 September 1526 after its passage through the western Pacific.',
  },
  {
    id: 'loaisa-9', number: 9, title: 'Toward Mindanao', from: 'Guam', to: 'Mindanao', date: 'September 1526', startDateIso: '1526-09-05T12:00:00Z',
    start: { lat: 13.4443, lon: 144.7937 }, destination: { lat: 8.0, lon: 125.0 }, headingDeg: 250,
    briefing: 'Leave the Marianas and navigate southwest toward Mindanao and the Philippine archipelago.',
    completion: 'Mindanao reached. The Spice Islands are now within the final regional passage.',
    historicalNote: 'After Guam, the surviving flagship continued toward Mindanao before making for the Moluccas.',
  },
  {
    id: 'loaisa-10', number: 10, title: 'The Spice Islands', from: 'Mindanao', to: 'Tidore', date: 'September – October 1526', startDateIso: '1526-09-20T12:00:00Z',
    start: { lat: 8.0, lon: 125.0 }, destination: { lat: 0.683, lon: 127.4 }, headingDeg: 185,
    briefing: 'Navigate the final island-strewn passage from Mindanao toward Tidore in the Moluccas. This is the campaign’s final sailing mission.',
    completion: 'Tidore reached. The surviving Loaísa expedition has arrived in the Moluccas.',
    historicalNote: 'Only the Santa María de la Victoria ultimately reached the Moluccas. Elcano himself had died during the Pacific crossing, so the final missions follow the expedition he helped lead rather than his personal voyage.',
  },
];

export const campaigns: Campaign[] = [
  {
    id: 'tutorial',
    title: 'Tutorial',
    subtitle: 'Mission 0',
    description: 'A short playable prelude from San Sebastián to A Coruña that teaches the sailing controls before the historical expedition begins.',
    missions: [tutorialMission],
  },
  {
    id: 'loaisa-elcano',
    title: 'Loaísa–Elcano Expedition',
    subtitle: 'To the Moluccas · 1525–1526',
    description: 'Follow the westbound expedition from A Coruña through the Atlantic, Strait of Magellan and Pacific to the Moluccas, one historical leg at a time.',
    missions: loaísaMissions,
  },
];

export const allMissions = campaigns.flatMap((campaign) => campaign.missions);

export function missionFromUrl(): Mission {
  const selected = new URLSearchParams(window.location.search).get('mission');
  return allMissions.find((mission) => mission.id === selected) ?? tutorialMission;
}

export function campaignForMission(mission: Mission): Campaign {
  return campaigns.find((campaign) => campaign.missions.some((candidate) => candidate.id === mission.id)) ?? campaigns[0];
}

export function worldStateForMission(mission: Mission): WorldState {
  return {
    time: new Date(mission.startDateIso),
    elapsedHours: 0,
    ship: { position: { ...mission.start }, headingDeg: mission.headingDeg, speed: 0 },
    destination: { ...mission.destination },
  };
}
