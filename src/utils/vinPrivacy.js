export function maskVin(vin = '') {
  const value = String(vin || '').trim().toUpperCase();
  if (!value) return 'VIN unavailable';
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function canRevealVin(vin = '') {
  return String(vin || '').trim().length >= 11;
}
