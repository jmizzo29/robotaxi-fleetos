import LandingHeader from './landing/LandingHeader';

export default function PublicHeader({ onNavigate }) {
  return <LandingHeader onNavigate={onNavigate} variant="monument" />;
}
