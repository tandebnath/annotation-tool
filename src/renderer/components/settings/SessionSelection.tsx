import React from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';

const SessionSelection: React.FC<{ onNewSession: () => void; onContinue: () => void; sessionExists: boolean }> = ({
  onNewSession,
  onContinue,
  sessionExists,
}) => {
  console.log("DEBUG: sessionExists in SessionSelection:", sessionExists); // 🔍 Log sessionExists

  return (
    <Box sx={{ textAlign: 'center', padding: '2rem' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
        Select Work Session
      </Typography>

      {/* Continue Current Session */}
      <Button
        variant="contained"
        color="primary"
        onClick={onContinue}
        disabled={!sessionExists} // Should only be disabled if false
        fullWidth
        sx={{
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          opacity: sessionExists ? 1 : 0.5,
        }}
      >
        Continue Current Work Session
      </Button>

      <Divider sx={{ marginY: '2rem' }} />

      {/* Start New Session */}
      <Button
        variant="contained"
        color="secondary"
        onClick={onNewSession}
        fullWidth
        sx={{
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: 'bold',
        }}
      >
        Start New Work Session
      </Button>
    </Box>
  );
};

export default SessionSelection;