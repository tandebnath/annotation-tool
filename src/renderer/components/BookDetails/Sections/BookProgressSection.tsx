import React from 'react';
import { Box, Typography } from '@mui/material';

interface BookProgressSectionProps {
  completion: number;
}

const BookProgressSection: React.FC<BookProgressSectionProps> = ({ completion }) => {
  return (
    <Box sx={{ marginBottom: '2rem' }}>
      <Typography
        gutterBottom
        sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}
      >
        Progress
      </Typography>
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#e0e0e0',
          borderRadius: '0.25rem',
        }}
      >
        <Box
          sx={{
            width: `${completion}%`,
            backgroundColor: '#AFE1AF',
            color: 'black',
            padding: '0.25rem',
            borderRadius: '0.25rem',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {completion}%
        </Box>
      </Box>
    </Box>
  );
};

export default BookProgressSection;