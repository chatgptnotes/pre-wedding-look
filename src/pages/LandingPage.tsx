import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingPageEnhanced from '../components/LandingPageEnhanced';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/features');
  };
  
  const handleExploreMode = (modeId: string) => {
    if (modeId === 'classic') {
      navigate('/classic');
    } else if (modeId === 'blind-date') {
      navigate('/match');
    } else {
      navigate('/features', { state: { activeTab: modeId } });
    }
  };
  
  return <LandingPageEnhanced onGetStarted={handleGetStarted} onExploreMode={handleExploreMode} />;
};

export default LandingPage;