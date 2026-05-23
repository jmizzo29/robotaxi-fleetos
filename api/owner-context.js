import { getSession } from './_lib/auth.js';
import { getExternalContextForVehicle } from './_lib/externalContext.js';

function safeVehiclePayload(value = {}) {
  return {
    id: value.id,
    vin: value.vin,
    name: value.name || value.display_name,
    latitude: value.latitude,
    longitude: value.longitude,
    battery: value.battery,
    chargingState: value.chargingState,
    odometer: value.odometer,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const session = await getSession(req, res, { create: false });
  if (!session) {
    return res.status(401).json({ error: 'auth_required', message: 'Sign in before requesting owner intelligence.' });
  }

  const vehicle = safeVehiclePayload(req.body?.vehicle || {});
  const context = await getExternalContextForVehicle(vehicle);

  return res.status(200).json({
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
    },
    ...context,
  });
}
