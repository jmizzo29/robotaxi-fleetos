import { describe, expect, it } from 'vitest';
import { formatBilledAmount, formatChargeEnergy, normalizeChargeHistory } from './teslaChargeHistory';

describe('normalizeChargeHistory', () => {
  it('maps Tesla history rows to billed kWh and location', () => {
    const sessions = normalizeChargeHistory({
      data: [{
        sessionId: 'abc',
        vin: '5YJ3E1EA7KF000001',
        chargeStartDateTime: '2026-08-01T03:00:00Z',
        energyAdded: 41.2,
        siteLocationName: 'Supercharger Orlando',
        fees: [{ feeTotal: 12.4, currencyCode: 'USD' }],
        chargingLocation: { latitude: 28.4, longitude: -81.3 },
      }],
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].energyKwh).toBe(41.2);
    expect(sessions[0].billedAmount).toBe(12.4);
    expect(sessions[0].locationName).toBe('Supercharger Orlando');
    expect(sessions[0].latitude).toBe(28.4);
  });

  it('formats energy and billed amount', () => {
    expect(formatChargeEnergy(12.34)).toBe('12.3 kWh');
    expect(formatBilledAmount(9, 'USD')).toBe('$9.00');
  });
});
