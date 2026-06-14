export const legalCopy = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    subtitle: 'How ROBOAGENT handles your Tesla fleet data during beta.',
    sections: [
      ['What we collect', 'When you connect Tesla, ROBOAGENT may process VIN, precise vehicle location, battery, odometer, charging state, vehicle state, tire/health signals when available, software version, asset records, revenue records, and app usage events.'],
      ['Why we use it', 'ROBOAGENT uses this data to show telemetry, owner finance, parking history, location intelligence, AI recommendations, and beta diagnostics.'],
      ['Storage', 'ROBOAGENT stores important beta records in Postgres-backed backend endpoints. Browser storage is limited to local consent and session preferences.'],
      ['Sharing', 'ROBOAGENT does not sell Tesla telemetry. Free third-party APIs may receive location or VIN only when features such as weather, air quality, reverse geocoding, or VIN decode are used.'],
      ['Deletion', 'Beta users can delete ROBOAGENT backend data from Settings. Tesla access can be revoked from Tesla account/app third-party access controls.'],
    ],
    dataRows: [
      ['vehicle status', 'battery · charging · range'],
      ['location', 'GPS when permitted'],
      ['fleet health', 'odometer · software · alerts'],
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of Service',
    subtitle: 'Beta terms, safety boundaries, and Tesla relationship.',
    sections: [
      ['Beta software', 'ROBOAGENT is in beta and may be inaccurate, unavailable, incomplete, or delayed. Do not rely on it for emergency, safety, security, or autonomous-driving decisions.'],
      ['Tesla boundary', 'ROBOAGENT is not affiliated with or endorsed by Tesla. Tesla controls vehicle access, API availability, autonomous driving eligibility, and command execution.'],
      ['Your responsibility', 'The owner remains responsible for vehicle operation, rental decisions, charging, maintenance, insurance, taxes, and compliance with platform rules.'],
      ['Consent', 'By connecting Tesla, you authorize ROBOAGENT to process telemetry needed to provide the beta service. You may revoke access and request deletion.'],
      ['No warranty', 'ROBOAGENT is provided as-is during beta with no guarantee of revenue, savings, uptime, or data accuracy.'],
    ],
    dataRows: [],
  },
};

export const legalNavLinks = [
  { label: 'Privacy Policy', route: 'privacy', hint: 'data handling' },
  { label: 'Terms of Service', route: 'terms', hint: 'beta terms' },
];
