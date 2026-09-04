/** Tesla Fleet OAuth is one connection per user. Extra VINs need plan coverage. */

export function getAddVehicleCopy({ teslaConnected = false, billing = null } = {}) {
  const covered = Number(billing?.coveredVehicles ?? billing?.includedVehicles ?? 1) || 1;
  const synced = Number(billing?.vehicleCount ?? 0) || 0;
  const paywalled = Boolean(billing?.billingRequired) || synced > covered;

  return {
    title: teslaConnected ? 'Add another vehicle' : 'Connect Tesla',
    eyebrow: teslaConnected ? 'Same Tesla account' : 'Tesla Fleet API',
    body: teslaConnected
      ? 'Tesla OAuth is one connection per ROBOAGENT user. Re-authorizing lists every car Tesla returns on that account — it does not create a second account.'
      : 'Connect your Tesla account once. ROBOAGENT lists every vehicle Tesla returns. The beta plan includes the first Tesla.',
    detail: paywalled
      ? `This plan covers ${covered} Tesla${covered === 1 ? '' : 's'}. Additional VINs need a paid vehicle plan before they will sync. There is no checkout in this build — extra cars stay blocked until coverage is added.`
      : teslaConnected
        ? `Beta includes the first Tesla. ${synced} synced · plan covers ${covered}. Extra cars on this Tesla account need plan coverage, not a second OAuth login.`
        : 'Additional cars on the same Tesla account need plan coverage. Connecting Tesla again does not invent a second ROBOAGENT account.',
    cta: teslaConnected ? 'Re-authorize Tesla account' : 'Connect Tesla',
    footnote: teslaConnected
      ? 'After Tesla approval you return to Command. New VINs appear only if your plan covers them.'
      : 'After Tesla approval you return to Command with vehicles Tesla listed for this account.',
    paywalled,
    covered,
    synced,
  };
}
