import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

interface AnnotationTypeSelectionProps {
  onSelect: (type: 'prose' | 'poetry') => void;
  selectedType: 'prose' | 'poetry' | '';
  onBack: () => void;
}

const AnnotationTypeSelection: React.FC<AnnotationTypeSelectionProps> = ({
  onSelect,
  selectedType,
  onBack,
}) => {
  const [selected, setSelected] = useState<'prose' | 'poetry' | ''>(
    selectedType || '',
  );

  useEffect(() => {
    if (selectedType) setSelected(selectedType);
  }, [selectedType]);

  const handleSelection = (type: 'prose' | 'poetry') => {
    setSelected(type);
  };

  return (
    <Box sx={{ textAlign: 'center', padding: '2rem' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ marginBottom: 2, fontWeight: 'bold' }}
        >
          Back
        </Button>
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
          color="secondary"
          onClick={() => handleSelection('prose')}
        >
          Prose
        </Button>
        <Button
          variant={selected === 'poetry' ? 'contained' : 'outlined'}
          color="secondary"
          onClick={() => handleSelection('poetry')}
        >
          Poetry
        </Button>
      </Box>

      {/* Proceed Button with Fixed Width */}
      <Button
        variant="contained"
        color="success"
        disabled={!selected}
        onClick={async () => {
          if (selected) {
            // Save annotation type to settings.json
            await window.electron.ipcRenderer.invoke('settings:save', {
              type: 'annotationType',
              settings: { annotationType: selected },
            });

            onSelect(selected); // Trigger transition after clicking Proceed
          }
        }}
        sx={{ width: '10rem', fontWeight: 'bold' }}
      >
        Proceed
      </Button>
    </Box>
  );
};

export default AnnotationTypeSelection;
