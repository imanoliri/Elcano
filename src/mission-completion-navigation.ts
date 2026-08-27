import { campaignForMission, missionFromUrl } from './missions';
import { shipPresetFromId } from './ship-selection';

const modal = document.querySelector<HTMLElement>('#modal');
const modalTitle = document.querySelector<HTMLElement>('#modal-title');
const actionButton = document.querySelector<HTMLButtonElement>('#start-mission');

if (modal && modalTitle && actionButton) {
  const completionModal = modal;
  const completionTitle = modalTitle;
  const completionButton = actionButton;
  const activeMission = missionFromUrl();
  const activeCampaign = campaignForMission(activeMission);
  const activeShip = shipPresetFromId(new URLSearchParams(window.location.search).get('ship'));
  const missionIndex = activeCampaign.missions.findIndex((mission) => mission.id === activeMission.id);
  const nextMission = missionIndex >= 0 && missionIndex < activeCampaign.missions.length - 1
    ? activeCampaign.missions[missionIndex + 1]
    : null;

  function missionIsComplete() {
    return completionTitle.textContent?.trim() === `${activeMission.to} reached`;
  }

  function navigateToMission(missionId: string) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mission', missionId);
    url.searchParams.set('ship', activeShip.id);
    url.searchParams.set('play', '1');
    window.location.assign(url);
  }

  function returnToVoyageMenu() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mission', activeMission.id);
    url.searchParams.set('ship', activeShip.id);
    window.location.assign(url);
  }

  function syncCompletionAction() {
    if (!missionIsComplete()) {
      completionButton.textContent = 'Take the helm';
      completionButton.removeAttribute('data-completion-action');
      return;
    }

    if (nextMission) {
      completionButton.textContent = 'Continue to next mission →';
      completionButton.dataset.completionAction = 'next';
      completionButton.setAttribute('aria-label', `Continue to Mission ${nextMission.number}: ${nextMission.title}`);
    } else {
      completionButton.textContent = 'Campaign complete · return to voyage menu';
      completionButton.dataset.completionAction = 'menu';
      completionButton.setAttribute('aria-label', 'Campaign complete. Return to voyage menu');
    }
  }

  completionButton.addEventListener('click', (event) => {
    if (!missionIsComplete()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (nextMission) navigateToMission(nextMission.id);
    else returnToVoyageMenu();
  }, true);

  new MutationObserver(syncCompletionAction).observe(completionModal, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
    characterData: true,
  });

  syncCompletionAction();
}
