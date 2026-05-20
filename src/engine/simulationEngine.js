export function updateFleet({
  fleet,
  chargingStations
}) {

  return fleet.map((vehicle) => {

    let targetLat = vehicle.targetLat
    let targetLng = vehicle.targetLng
    let status = vehicle.status
    let assignment = vehicle.assignment

    /* LOW BATTERY */

    if (vehicle.battery < 30) {

      const nearest =
        chargingStations[
          Math.floor(Math.random() * chargingStations.length)
        ]

      targetLat = nearest.latitude
      targetLng = nearest.longitude

      status = 'CHARGING'
      assignment = `Routing to ${nearest.name}`
    }

    const latDiff =
      targetLat - vehicle.latitude

    const lngDiff =
      targetLng - vehicle.longitude

    const distance =
      Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)

    /* DESTINATION ROTATION */

    if (distance < 0.01 && status !== 'CHARGING') {

      const destinations = [
        {
          lat: 28.5383,
          lng: -81.3792,
          status: 'PICKUP',
          assignment: 'Airport pickup assignment'
        },
        {
          lat: 27.9506,
          lng: -82.4572,
          status: 'REPOSITIONING',
          assignment: 'Rebalancing Tampa fleet'
        },
        {
          lat: 25.7617,
          lng: -80.1918,
          status: 'EN ROUTE',
          assignment: 'South Beach passenger trip'
        }
      ]

      const next =
        destinations[
          Math.floor(Math.random() * destinations.length)
        ]

      targetLat = next.lat
      targetLng = next.lng
      status = next.status
      assignment = next.assignment
    }

    return {
      ...vehicle,

      latitude:
        vehicle.latitude + latDiff * 0.02,

      longitude:
        vehicle.longitude + lngDiff * 0.02,

      targetLat,
      targetLng,

      status,
      assignment,

      battery:
        status === 'CHARGING'
          ? Math.min(100, vehicle.battery + 0.8)
          : Math.max(20, vehicle.battery - Math.random() * 0.3),

      utilization:
        Math.min(
          100,
          vehicle.utilization + Math.random() * 0.3
        ),

      profitability:
        Math.max(
          60,
          Math.min(
            100,
            vehicle.profitability +
              (Math.random() * 4 - 2)
          )
        ),

      anomalyRisk:
        Math.max(
          1,
          Math.min(
            100,
            vehicle.anomalyRisk +
              (Math.random() * 8 - 4)
          )
        ),

      maintenanceScore:
        Math.max(
          60,
          Math.min(
            100,
            vehicle.maintenanceScore +
              (Math.random() * 4 - 2)
          )
        )
    }
  })
}