import { useEffect, useState } from 'react';
import { getAiFleetAnalysis } from '../services/aiService';

const initialAnalysis = {
  provider: 'pending',
  model: 'pending',
  generatedAt: null,
  summary: 'RoboAgent AI is preparing an operating assessment.',
  alerts: [],
  recommendations: [],
};

export default function useAiFleetAnalysis({ fleet, realSyncStatus, enabled = true }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!enabled) return;
      if (!fleet || fleet.length === 0) return;

      setIsAnalyzing(true);

      try {
        const nextAnalysis = await getAiFleetAnalysis({
          fleet,
          context: {
            realSyncStatus,
            realVehicleCount: fleet.filter((vehicle) => vehicle.isReal).length,
            simulationVehicleCount: fleet.filter((vehicle) => !vehicle.isReal).length,
          },
        });

        setAnalysis(nextAnalysis);
      } catch (error) {
        setAnalysis((current) => ({
          ...current,
          provider: 'unavailable',
          summary: error.message || 'RoboAgent AI analysis is unavailable.',
        }));
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [enabled, fleet, realSyncStatus]);

  return {
    analysis,
    isAnalyzing,
  };
}
