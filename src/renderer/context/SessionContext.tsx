import React, { createContext, useContext, useEffect, useState } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { validateSettings } from '../utils/settings/validateSettings';

interface SessionContextType {
  annotationType: 'prose' | 'poetry' | '';
  sessionExists: boolean;
  setAnnotationType: (type: 'prose' | 'poetry' | '') => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [annotationType, setAnnotationType] = useState<'prose' | 'poetry' | ''>(
    '',
  );
  const [isLoading, setIsLoading] = useState(true);

  const sessionExists = annotationType !== '';

  useEffect(() => {
    const loadInitialSettings = async () => {
      const settings =
        await window.electron.ipcRenderer.invoke('settings:load');
      const { annotationType, ...config } = settings || {};

      if (
        (annotationType === 'poetry' || annotationType === 'prose') &&
        validateSettings(config)
      ) {
        setAnnotationType(annotationType);
      }

      setIsLoading(false);
    };

    loadInitialSettings();
  }, []);

  const resetSession = () => {
    setAnnotationType('');
    window.electron.ipcRenderer.invoke('settings:reset');
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f8f8',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SessionContext.Provider
      value={{
        annotationType,
        sessionExists,
        setAnnotationType,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
