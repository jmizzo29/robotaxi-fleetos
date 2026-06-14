import { describe, expect, it } from 'vitest';
import { getFleetMembersByTile } from './monumentUtils';

const fleet = [
  { id: 'CAR-001', status: 'REPOSITIONING', latitude: 28.5, longitude: -81.3 },
  { id: 'CAR-002', status: 'CHARGING', latitude: 28.4, longitude: -81.4 },
  { id: 'CAR-003', status: 'OFFLINE', latitude: 28.3, longitude: -81.5 },
  { id: 'CAR-004', status: 'IN SERVICE', maintenanceScore: 70 },
];

describe('getFleetMembersByTile', () => {
  it('returns active vehicles for the active tile', () => {
    const members = getFleetMembersByTile('active', fleet, [], 0, 'idle');
    expect(members).toHaveLength(1);
    expect(members[0].cab).toBe('CAB-001');
  });

  it('returns charging vehicles for the charge tile', () => {
    const members = getFleetMembersByTile('charging', fleet, [], 0, 'idle');
    expect(members).toHaveLength(1);
    expect(members[0].cab).toBe('CAB-002');
  });

  it('returns offline and service vehicles for the down tile', () => {
    const members = getFleetMembersByTile('down', fleet, [], 0, 'idle');
    expect(members).toHaveLength(2);
    expect(members.map((entry) => entry.cab).sort()).toEqual(['CAB-003', 'CAB-004']);
  });
});
