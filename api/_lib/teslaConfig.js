/** Tesla Fleet OAuth is configured when a client id is present. */
export function isTeslaOAuthConfigured(env = process.env) {
  return Boolean(env?.TESLA_CLIENT_ID);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Visible error page when Tesla OAuth cannot start. Never a silent /#/login bounce. */
export function oauthStartErrorPage(message) {
  const safe = escapeHtml(message || 'Unable to start Tesla connection.');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ROBOAGENT</title>
  </head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#08090B;color:#F7F7F5;font-family:Inter,ui-sans-serif,system-ui,sans-serif;padding:24px;">
    <main style="width:100%;max-width:440px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C6C8CE;">Tesla sign-in</p>
      <h1 style="margin:0 0 12px;font-size:28px;letter-spacing:-0.03em;">Could not start Tesla OAuth</h1>
      <p style="margin:0 0 24px;line-height:1.5;color:#C4C6CB;">${safe}</p>
      <p><a href="/#/login" style="color:#F7F7F5;">Return to sign in</a></p>
    </main>
  </body>
</html>`;
}
