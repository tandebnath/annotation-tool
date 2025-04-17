import React from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

interface BookNotesSectionProps {
  notes: string;
  setNotes: (val: string) => void;
  onSave: () => void;
  onClear: () => void;
}

const BookNotesSection: React.FC<BookNotesSectionProps> = ({
  notes,
  setNotes,
  onSave,
  onClear,
}) => {
  return (
    <Box sx={{ marginBottom: '2rem' }}>
      <Typography
        gutterBottom
        sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}
      >
        Notes
      </Typography>
      <TextField
        multiline
        rows={3}
        variant="outlined"
        fullWidth
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '1rem',
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={onSave}
          sx={{
            marginRight: '1rem',
            fontWeight: 'bold',
            backgroundColor: 'var(--proceed-color)',
            color: 'white',
            '&:hover': { backgroundColor: 'var(--proceed-hover)' },
            '&:active': { backgroundColor: 'var(--proceed-active)' },
          }}
        >
          Save
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onClear}
          sx={{
            fontWeight: 'bold',
            backgroundColor: 'var(--cancel-color)',
            color: 'white',
            '&:hover': { backgroundColor: 'var(--cancel-hover)' },
            '&:active': { backgroundColor: 'var(--cancel-active)' },
          }}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
};

export default BookNotesSection;
