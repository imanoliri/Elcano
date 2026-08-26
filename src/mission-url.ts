export function selectedMissionId(): string | null {
  return new URLSearchParams(window.location.search).get('mission');
}
