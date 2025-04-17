import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import BackButton from '../BackButton/BackButton';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';

const AnnotationTypeSelection: React.FC = () => {
  const [selected, setSelected] = useState<'prose' | 'poetry' | ''>('');
  const navigate = useNavigate();

  const { setAnnotationType } = useSession();

  const handleSelection = (type: 'prose' | 'poetry') => {
    setSelected(type);
  };

  const handleProceed = async () => {
    if (!selected) return;

    // Persist only the annotation type as a starter
    await window.electron.ipcRenderer.invoke('settings:save', {
      type: selected,
      settings: {}, // Start with an empty object
    });

    setAnnotationType(selected);
    navigate('/settings/annotation-settings');
  };

  return (
    <Box sx={{ textAlign: 'center', padding: '2rem' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <BackButton navigateTo="/settings" />
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 3 }}>
        What do you want to annotate?
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          marginBottom: 3,
        }}
      >
        <Button
          variant={selected === 'prose' ? 'contained' : 'outlined'}
          onClick={() => handleSelection('prose')}
          sx={{
            fontWeight: 'bold',
            textTransform: 'none',
            backgroundColor:
              selected === 'prose' ? 'var(--primary-color)' : 'transparent',
            color: selected === 'prose' ? 'var(--text-color)' : 'inherit',
            '&:hover': {
              backgroundColor:
                selected === 'prose'
                  ? 'var(--primary-hover)'
                  : 'var(--primary-color)',
              color: 'var(--text-color)',
            },
          }}
        >
          Prose
        </Button>
        <Button
          variant={selected === 'poetry' ? 'contained' : 'outlined'}
          onClick={() => handleSelection('poetry')}
          sx={{
            fontWeight: 'bold',
            textTransform: 'none',
            backgroundColor:
              selected === 'poetry' ? 'var(--primary-color)' : 'transparent',
            color: selected === 'poetry' ? 'var(--text-color)' : 'inherit',
            '&:hover': {
              backgroundColor:
                selected === 'poetry'
                  ? 'var(--primary-hover)'
                  : 'var(--primary-color)',
              color: 'var(--text-color)',
            },
          }}
        >
          Poetry
        </Button>
      </Box>

      <Button
        variant="contained"
        disabled={!selected}
        onClick={handleProceed}
        sx={{
          width: '10rem',
          fontWeight: 'bold',
          backgroundColor: 'var(--proceed-color)',
          color: 'var(--text-color)',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'var(--proceed-hover)',
          },
        }}
      >
        Proceed
      </Button>
    </Box>
  );
};

export default AnnotationTypeSelection;