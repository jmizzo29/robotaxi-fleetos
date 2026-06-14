import {
  getCommandFleetStatusStrip,
  getCommandOperationalSource,
} from './vehicleDisplayUtils';

export function getMapMonumentHero(fleet, realFleet, totalEarnings, syncState) {
  const strip = getCommandFleetStatusStrip(fleet, realFleet, totalEarnings, syncState);
  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  const city = source.find((vehicle) => vehicle.city)?.city;
  const cityLabel = city ? String(city).split(',')[0].trim() : 'Orlando';

  return {
    label: 'MAP',
    amount: `${strip.active?.value || 0}/${strip.total || source.length || 0}`,
    subline: `online now · ${cityLabel}`,
    active: Number(strip.active?.value) || 0,
    total: strip.total || source.length || 0,
  };
}

export function getMapFooterLine(fleet, realFleet, totalEarnings, syncState) {
  const source = getCommandOperationalSource(fleet, realFleet, totalEarnings, syncState);
  const moving = source.find((vehicle) => {
    const status = String(vehicle?.status || '').toUpperCase();
    return status.includes('ROUTE') || status.includes('PICK') || status.includes('SERVICE');
  });
  if (moving) {
    const id = String(moving.id || '').match(/\d+/);
    const cab = id ? `CAB-${String(id[0]).padStart(2, '0')}` : 'CAB-03';
    return `${cab} en route to MCO.`;
  }
  return 'Tap map for live fleet positions.';
}
