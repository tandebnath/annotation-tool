import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

interface AddLabelModalProps {
  open: boolean;
  selectedCategory: string;
  newLabel: string;
  persistLabel: boolean;
  onClose: () => void;
  onLabelChange: (value: string) => void;
  onPersistChange: (checked: boolean) => void;
  onAddLabel: () => void;
}

const AddLabelModalSection: React.FC<AddLabelModalProps> = ({
  open,
  selectedCategory,
  newLabel,
  persistLabel,
  onClose,
  onLabelChange,
  onPersistChange,
  onAddLabel,
}) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.75rem',
        boxShadow: 6,
        zIndex: 1000,
        width: '300px',
        border: '1px solid var(--accent-border)',
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
        Add Label to <strong>{selectedCategory}</strong>
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="Label Name"
        value={newLabel}
        onChange={(e) => onLabelChange(e.target.value)}
        sx={{ marginBottom: '1rem' }}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={persistLabel}
            onChange={(e) => onPersistChange(e.target.checked)}
          />
        }
        label="Persist Label?"
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1.5rem',
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={onClose}
          sx={{
            backgroundColor: 'var(--secondary-main)',
            '&:hover': { backgroundColor: 'var(--secondary-hover)' },
            fontWeight: 'bold',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onAddLabel}
          sx={{
            backgroundColor: 'var(--proceed-color)',
            '&:hover': { backgroundColor: 'var(--proceed-hover)' },
            fontWeight: 'bold',
          }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default AddLabelModalSection;