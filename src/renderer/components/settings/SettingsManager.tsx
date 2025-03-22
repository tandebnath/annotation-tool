import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import SessionSelection from './SessionSelection';
import AnnotationTypeSelection from './AnnotationTypeSelection';
import ProseSettings from './ProseSettings';
import PoetrySettings from './PoetrySettings';

const SettingsManager: React.FC = () => {
  const [step, setStep] = useState<'session-selection' | 'select-type' | 'prose-settings' | 'poetry-settings'>('session-selection');
  const [annotationType, setAnnotationType] = useState<'prose' | 'poetry' | ''>('');
  const [sessionExists, setSessionExists] = useState(false);

  useEffect(() => {
    window.electron.ipcRenderer.invoke('settings:load').then((settings) => {
      console.log("DEBUG: Loaded Settings in SettingsManager:", settings); // 🔍 Log settings
  
      // Ensure annotationType is correctly detected
      const storedAnnotationType = settings.annotationType || settings.currentSession?.annotationType || '';
  
      if (storedAnnotationType) { 
        setAnnotationType(storedAnnotationType);
        setSessionExists(true);
        console.log("✅ ACTIVE SESSION DETECTED:", storedAnnotationType);
      } else {
        console.warn("⚠️ WARNING: No active session found.");
        setSessionExists(false);
      }
    });
  }, []);

  // Handle starting a new session
  const handleNewSession = () => {
    window.electron.ipcRenderer.invoke('settings:reset'); // Reset settings
    setAnnotationType('');
    setSessionExists(false);
    setStep('select-type'); // Move to annotation type selection
  };

  // Handle continuing the current session
  const handleContinueSession = () => {
    setStep(annotationType === 'prose' ? 'prose-settings' : 'poetry-settings');
  };

  // Handle annotation type selection
  const handleAnnotationTypeSelection = (type: 'prose' | 'poetry') => {
    setAnnotationType(type);
    setSessionExists(true);
    window.electron.ipcRenderer.invoke('settings:save', { 
      type: 'currentSession', // ✅ Ensure it is stored under `currentSession`
      settings: { annotationType: type } 
    });
    setStep(type === 'prose' ? 'prose-settings' : 'poetry-settings');
  };

  return (
    <Container sx={{ padding: '2rem' }}>
      {step === 'session-selection' && (
        <SessionSelection onContinue={handleContinueSession} onNewSession={handleNewSession} sessionExists={sessionExists} />
      )}
      {step === 'select-type' && <AnnotationTypeSelection onSelect={handleAnnotationTypeSelection} selectedType={annotationType} onBack={() => setStep('session-selection')} />}
      {step === 'prose-settings' && <ProseSettings onBack={() => setStep('select-type')} />}
      {step === 'poetry-settings' && <PoetrySettings onBack={() => setStep('select-type')} />}
    </Container>
  );
};

export default SettingsManager;