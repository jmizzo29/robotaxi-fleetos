export function getSettingsHero(realFleet = []) {
  const count = Array.isArray(realFleet) ? realFleet.length : 0;

  return {
    label: 'SETTINGS',
    amount: count > 0 ? `${count} Cybercab${count === 1 ? '' : 's'}` : 'Account',
    subline: 'Beta program · privacy & support',
    healthy: true,
  };
}

export function getSettingsRows(realFleet = []) {
  const count = Array.isArray(realFleet) ? realFleet.length : 0;

  return [
    { cab: 'Program', event: 'ROBOAGENT beta', value: 'Active', tone: 'positive' },
    {
      cab: 'Fleet',
      event: 'Linked vehicles',
      value: count > 0 ? String(count) : '—',
      tone: count > 0 ? 'positive' : 'neutral',
    },
    { cab: 'Privacy', event: 'Telemetry consent', value: 'OK', tone: 'positive' },
    { cab: 'Support', event: 'Beta feedback', value: 'Account', tone: 'neutral' },
  ];
}

export function getSettingsFooterLine() {
  return 'Privacy, program status, and account preferences.';
}
