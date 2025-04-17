import React from 'react';
import { Box, Button, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';

import BackButton from '../BackButton/BackButton';
import { useSession } from '../../context/SessionContext';

const SessionSelection: React.FC = () => {
  const navigate = useNavigate();
  const { sessionExists, resetSession } = useSession();

  return (
    <Box sx={{ width: '100%', padding: '2rem 2rem 4rem 2rem' }}>
      {sessionExists && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          <BackButton label="Back to Home" navigateTo="/books" />
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '28rem',
          margin: '0 auto',
          gap: '2rem',
        }}
      >
        {sessionExists && (
          <>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() =>
                navigate('/settings/annotation-settings', {
                  state: { from: 'session-selection' },
                })
              }
              fullWidth
              sx={{
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 600,
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-color)',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'var(--primary-hover)',
                },
                '&:active': {
                  backgroundColor: 'var(--primary-active)',
                },
              }}
            >
              Modify Current Session Settings
            </Button>
            <Divider sx={{ width: '100%', mx: 'auto', my: 1}} />
          </>
        )}

        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            resetSession();
            navigate('/settings/select-type');
          }}
          fullWidth
          sx={{
            padding: '0.85rem',
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: 'var(--primary-color)',
            color: 'var(--text-color)',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'var(--primary-hover)',
            },
            '&:active': {
              backgroundColor: 'var(--primary-active)',
            },
          }}
        >
          Start New Work Session
        </Button>
      </Box>
    </Box>
  );
};

export default SessionSelection;
