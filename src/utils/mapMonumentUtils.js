import {
  getCommandFleetStatusStrip,
} from './vehicleDisplayUtils';
import {
  getMapLocatedVehicles,
  getMapTruthSource,
  isVehicleMoving,
} from './mapTruthUtils';

export function getMapMonumentHero(fleet, realFleet, totalEarnings, syncState, { mock = false } = {}) {
  const source = getMapTruthSource(fleet, realFleet, { mock });
  const strip = getCommandFleetStatusStrip(source, mock ? [] : source, totalEarnings, syncState);
  const located = getMapLocatedVehicles(source);
  const city = located.find((vehicle) => vehicle.city)?.city
    || source.find((vehicle) => vehicle.city)?.city;
  const cityLabel = city ? String(city).split(',')[0].trim() : null;
  const total = source.length;
  const active = Number(strip.active?.value) || 0;

  let subline = 'no vehicles yet';
  if (mock) {
    subline = cityLabel ? `demo preview · ${cityLabel}` : 'demo preview — not live telemetry';
  } else if (total > 0 && located.length === 0) {
    subline = 'Tesla linked · no GPS yet';
  } else if (located.length > 0) {
    subline = cityLabel ? `live GPS · ${cityLabel}` : 'live GPS';
  } else if (syncState === 'loading') {
    subline = 'syncing Tesla';
  }

  return {
    label: 'MAP',
    amount: `${active}/${total}`,
    subline,
    active,
    total,
    located: located.length,
    mock,
  };
}

export function getMapFooterLine(fleet, realFleet, totalEarnings, syncState, { mock = false } = {}) {
  const source = getMapTruthSource(fleet, realFleet, { mock });
  const located = getMapLocatedVehicles(source);

  if (mock) {
    return 'Demo preview — simulated pins and demand overlays.';
  }
  if (syncState === 'loading') {
    return 'Syncing Tesla location…';
  }
  if (!source.length) {
    return 'Connect Tesla to show live fleet positions.';
  }
  if (!located.length) {
    return 'Tesla is linked, but no vehicle has reported GPS yet.';
  }

  const moving = located.find(isVehicleMoving);
  if (moving) {
    const name = moving.display_name || moving.name || 'Tesla';
    const city = moving.city ? String(moving.city).split(',')[0].trim() : null;
    return city ? `${name} moving near ${city}.` : `${name} is moving.`;
  }

  const parked = located[0];
  const name = parked.display_name || parked.name || 'Tesla';
  const city = parked.city ? String(parked.city).split(',')[0].trim() : null;
  return city ? `${name} parked in ${city}.` : `${located.length} Tesla${located.length === 1 ? '' : 's'} with live GPS.`;
}
