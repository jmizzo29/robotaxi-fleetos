import { deleteCurrentUserData, getSession } from '../_lib/auth.js';
import { hasPostgres } from '../_lib/db.js';
import {
  createDeleteConfirmToken,
  DELETE_CONFIRMATION_PHRASE,
  isValidDeleteConfirmation,
  parseJsonBody,
  verifyDeleteConfirmToken,
} from '../_lib/prodGuards.js';
import { auditEvent } from '../_lib/security.js';

function unauthorized(res) {
  res.status(401).json({
    error: 'LOGIN_REQUIRED',
    message: 'Sign in before deleting account data.',
  });
}

function issueConfirmChallenge(session, res) {
  const issued = createDeleteConfirmToken(session.userId);
  res.status(200).json({
    ok: true,
    prepared: true,
    confirmToken: issued.token,
    expiresInSeconds: issued.expiresInSeconds,
    confirmationPhrase: DELETE_CONFIRMATION_PHRASE,
    message: `Type ${DELETE_CONFIRMATION_PHRASE} and send the confirm token to permanently delete this account.`,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    res.setHeader('Allow', 'DELETE, POST');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!hasPostgres()) {
    res.status(503).json({
      error: 'DATABASE_REQUIRED',
      message: 'Postgres is required for account deletion.',
    });
    return;
  }

  const session = await getSession(req, res, { create: false }).catch(() => null);
  if (!session?.userId) {
    unauthorized(res);
    return;
  }

  const body = parseJsonBody(req);
  const wantsPrepare = req.method === 'POST'
    && (body.intent === 'prepare' || (!body.confirmToken && !body.confirmation && !body.confirm));

  if (wantsPrepare) {
    issueConfirmChallenge(session, res);
    return;
  }

  const confirmation = body.confirmation || body.confirm;
  if (!isValidDeleteConfirmation(confirmation)) {
    res.status(400).json({
      error: 'CONFIRMATION_REQUIRED',
      confirmationPhrase: DELETE_CONFIRMATION_PHRASE,
      message: `Type ${DELETE_CONFIRMATION_PHRASE} to confirm permanent deletion.`,
    });
    return;
  }

  if (!verifyDeleteConfirmToken(session.userId, body.confirmToken)) {
    res.status(400).json({
      error: 'CONFIRM_TOKEN_REQUIRED',
      message: 'Request a delete confirmation token first, then retry within 10 minutes.',
    });
    return;
  }

  const result = await deleteCurrentUserData(req, res);
  if (!result?.deleted) {
    unauthorized(res);
    return;
  }

  await auditEvent({
    userId: session.userId,
    action: 'user_data_deleted',
    resource: 'account',
    metadata: { deleted: result.deleted, fleetCount: result.fleetCount || 0 },
  }).catch(() => {});
  res.status(200).json({ ok: true, ...result });
}
