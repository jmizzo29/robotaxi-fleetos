const vehicleOwnership = {
  OCE: {
    model: 'Tesla Model X',
    trim: 'Performance',
    color: 'Pearl White Multi-Coat',
    tag: 'OCE',
    purchaseDate: '2024-09-18',
    pricePaid: 46900,
    currentBalance: 31240,
    lender: 'Tesla Finance',
    monthlyPayment: 742,
    insuranceRenewal: '2026-08-01',
    registrationState: 'FL',
  },
  'CAR-001': {
    model: 'FleetOS Sedan',
    trim: 'Autonomy Package',
    color: 'Graphite',
    tag: 'FL-001',
    purchaseDate: '2025-01-14',
    pricePaid: 38500,
    currentBalance: 21400,
    lender: 'Fleet Capital',
    monthlyPayment: 612,
    insuranceRenewal: '2026-05-30',
    registrationState: 'FL',
  },
  'CAR-002': {
    model: 'FleetOS Crossover',
    trim: 'Airport Duty',
    color: 'Silver',
    tag: 'FL-002',
    purchaseDate: '2025-02-02',
    pricePaid: 42100,
    currentBalance: 23950,
    lender: 'Fleet Capital',
    monthlyPayment: 641,
    insuranceRenewal: '2026-06-15',
    registrationState: 'FL',
  },
  'CAR-003': {
    model: 'FleetOS Sedan',
    trim: 'Urban Duty',
    color: 'Midnight Blue',
    tag: 'FL-003',
    purchaseDate: '2024-12-10',
    pricePaid: 37400,
    currentBalance: 19825,
    lender: 'Fleet Capital',
    monthlyPayment: 588,
    insuranceRenewal: '2026-04-20',
    registrationState: 'FL',
  },
  'CAR-004': {
    model: 'FleetOS Crossover',
    trim: 'Premium Route',
    color: 'Deep Black',
    tag: 'FL-004',
    purchaseDate: '2025-03-22',
    pricePaid: 44800,
    currentBalance: 27120,
    lender: 'Fleet Capital',
    monthlyPayment: 679,
    insuranceRenewal: '2026-07-10',
    registrationState: 'FL',
  },
};

export function getVehicleOwnership(vehicle) {
  const key = vehicle?.name || vehicle?.display_name || vehicle?.id;
  return vehicleOwnership[key] || vehicleOwnership[vehicle?.id] || null;
}

export default vehicleOwnership;
