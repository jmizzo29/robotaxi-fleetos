import { useEffect, useState } from 'react'

import { updateFleet } from '../engine/simulationEngine'

export default function useFleetSimulation({
  initialFleet,
  chargingStations,
  replayMode
}) {

  const [fleet, setFleet] = useState(initialFleet)

  const [timelineEvents, setTimelineEvents] = useState([
    {
      time: '7:42 PM',
      severity: 'INFO',
      message: 'Fleet orchestration engine initialized.'
    },
    {
      time: '7:44 PM',
      severity: 'SUCCESS',
      message: 'AI demand balancing activated.'
    }
  ])

  const [forecast, setForecast] = useState({
    projectedRevenue: 184200,
    surgeRisk: 'HIGH',
    predictedDemand: 'Orlando Corridor',
    congestionRisk: 'MEDIUM',
    aiConfidence: 94
  })

  const [systemLoad, setSystemLoad] = useState(67)

  useEffect(() => {

    const interval = setInterval(() => {

      /* VEHICLE ENGINE */

      setFleet((prev) =>
        updateFleet({
          fleet: prev,
          chargingStations
        })
      )

      /* TIMELINE */

      const eventPool = [
        {
          severity: 'INFO',
          message: 'AI rerouted Tampa corridor coverage.'
        },
        {
          severity: 'WARNING',
          message: 'Charging congestion detected in Orlando.'
        },
        {
          severity: 'SUCCESS',
          message: 'Autonomous charging optimization completed.'
        },
        {
          severity: 'CRITICAL',
          message: 'Emergency override activated for Miami region.'
        },
        {
          severity: 'WARNING',
          message: 'Dynamic surge pricing enabled.'
        },
        {
          severity: 'CRITICAL',
          message: 'AI anomaly detection triggered on CAR-003.'
        }
      ]

      if (Math.random() < 0.16) {

        const nextEvent =
          eventPool[
            Math.floor(Math.random() * eventPool.length)
          ]

        const time = new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit'
        })

        setTimelineEvents((prev) => [
          {
            time,
            severity: nextEvent.severity,
            message: nextEvent.message
          },
          ...prev.slice(0, 18)
        ])
      }

      /* FORECAST */

      const forecastZones = [
        {
          projectedRevenue: 184200,
          surgeRisk: 'HIGH',
          predictedDemand: 'Orlando Airport',
          congestionRisk: 'MEDIUM',
          aiConfidence: 94
        },
        {
          projectedRevenue: 201400,
          surgeRisk: 'CRITICAL',
          predictedDemand: 'Miami Beach',
          congestionRisk: 'HIGH',
          aiConfidence: 91
        },
        {
          projectedRevenue: 172800,
          surgeRisk: 'MEDIUM',
          predictedDemand: 'Downtown Tampa',
          congestionRisk: 'LOW',
          aiConfidence: 96
        }
      ]

      setForecast(
        forecastZones[
          Math.floor(Math.random() * forecastZones.length)
        ]
      )

      setSystemLoad(
        Math.floor(55 + Math.random() * 35)
      )

    }, replayMode ? 500 : 120)

    return () => clearInterval(interval)

  }, [replayMode, chargingStations])

  return {
    fleet,
    setFleet,
    timelineEvents,
    forecast,
    systemLoad
  }
}