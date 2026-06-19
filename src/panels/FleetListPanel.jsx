import FleetIntelligenceMockups from './FleetIntelligenceMockups';

export default function FleetListPanel({ fleet = [], onSelect }) {
  return <FleetIntelligenceMockups fleet={fleet} onSelect={onSelect} />;
}
