import React from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon } from '@mui/icons-material';
import logo from '../../../assets/logo.png';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the title based on the current route
  let title = '';
  if (location.pathname === '/') {
    title = 'List of Books';
  } else if (location.pathname.startsWith('/book')) {
    title = 'Book Details';
  } else if (location.pathname === '/settings') {
    title = 'Settings';
  }

  // Hide the navbar on the /settings route
  // if (location.pathname === '/settings') {
  //   return null;
  // }

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#13294B',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1000, // Ensure navbar stays on top
        padding: '0 2rem',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={logo}
            alt="App Logo"
            style={{ width: '7rem', height: '4.5rem' }}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h5"
            // sx={{
            //   fontFamily: 'PlayfairDisplay',
            //   color: '#fff',
            //   textAlign: 'center',
            //   flexGrow: 1,
            //   fontWeight: 600,
            //   textTransform: 'uppercase',
            // }}
            sx={{
              fontFamily: 'PlayfairDisplay',
              color: '#ffffff',
              textAlign: 'center',
              flexGrow: 1,
              letterSpacing: '0.05em',
              fontWeight: 600,
              textTransform: 'uppercase',
              textShadow: `
                -1px -1px 1px rgba(0, 0, 0, 0.6)
              `,
            }}
          >
            {title}
          </Typography>
        </Box>
        {location.pathname !== '/settings' && (
          <Box>
            <IconButton
              // sx={{
              //   backgroundColor: '#d3d3d3',
              //   color: 'black',
              //   '&:hover': {
              //     backgroundColor: '#bcbcbc',
              //   },
              // }}
              sx={{ color: '#fff' }}
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
