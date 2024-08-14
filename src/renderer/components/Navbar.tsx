import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the navbar on the /settings route
  if (location.pathname === '/settings') {
    return null;
  }

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1000, // Ensure navbar stays on top
        padding: '0 2rem',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Box>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#d3d3d3',
              color: 'black',
              '&:hover': {
                backgroundColor: '#bcbcbc',
              },
            }}
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
