import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateSettings } from '../../utils/settings/validateSettings';

const InitialRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSettings = async () => {
      const allSettings =
        await window.electron.ipcRenderer.invoke('settings:load');
      const { annotationType } = allSettings;

      console.log('InitialRedirect: loaded annotationType:', annotationType);
      console.log('InitialRedirect: full flat settings:', allSettings);

      const isValid =
        (annotationType === 'prose' || annotationType === 'poetry') &&
        validateSettings(allSettings);

      console.log('InitialRedirect: isValid?', isValid);

      if (isValid) {
        navigate('/books');
      } else {
        navigate('/settings');
      }
    };

    checkSettings();
  }, [navigate]);

  return null;
};

export default InitialRedirect;
