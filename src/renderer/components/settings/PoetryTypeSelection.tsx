import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

interface PoetryTypeSelectionProps {
  onSelect: () => void;
  selectedType: 'individual' | 'collections' | '';
  onBack: () => void;
}

const PoetryTypeSelection: React.FC<PoetryTypeSelectionProps> = ({
  onSelect,
  selectedType,
  onBack
}) => {
  const [selected, setSelected] = useState<'individual' | 'collections'>(
    'collections',
  );

  useEffect(() => {
    if (selectedType) setSelected(selectedType);
  }, [selectedType]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ marginBottom: 2, fontWeight: 'bold' }}
      >
        Back
      </Button>
      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
        Are they individual poetry books or poetry collections?
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="outlined" disabled>
          Individual Books (Coming Soon)
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{
            backgroundColor: selected === 'collections' ? '#1976D2' : 'inherit',
          }}
        >
          Poetry Collections
        </Button>
      </Box>

      <Button
        variant="contained"
        color="success"
        sx={{ marginTop: 3 }}
        onClick={onSelect}
      >
        Proceed
      </Button>
    </Box>
  );
};

export default PoetryTypeSelection;
