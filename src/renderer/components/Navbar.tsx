import React from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { Settings as SettingsIcon } from '@mui/icons-material';
import logo from '../../../assets/logo.png';
import illinoisLogo from '../../../assets/illinois_logo.png';

import { useSession } from '../context/SessionContext';

interface NavbarProps {
  onSearchChange?: (query: string) => void;
  customComponent?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({ onSearchChange, customComponent }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { annotationType } = useSession();

  // Determine the title based on the current route
  let title = '';
  if (location.pathname === '/') {
    title = 'Annotation Library';
  } else if (location.pathname === '/settings') {
    title = 'Session Selection';
  } else if (location.pathname === '/settings/select-type') {
    title = 'Annotation Type Selection';
  } else if (location.pathname === '/settings/annotation-settings') {
    title =
      annotationType === 'prose'
        ? 'Prose Annotation Settings'
        : annotationType === 'poetry'
          ? 'Poetry Annotation Settings'
          : 'Annotation Settings';
  } else if (matchPath('/book/:bookId', location.pathname)) {
    title = 'Volume Details';
  } else if (location.pathname === '/book') {
    title = 'Annotation Library';
  } else {
    title = 'Annotation Library'
  }

  // Hide the navbar on the /settings route
  // if (location.pathname === '/settings') {
  //   return null;
  // }

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#2F2323', // '#13294B'
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1000, // Ensure navbar stays on top
        padding: '0.5rem 2.5rem',
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
            src={illinoisLogo}
            alt="App Logo"
            style={{ width: '1.5rem', height: '2.5rem' }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          {!customComponent && (
            <Typography
              variant="h4"
              sx={{
                color: '#EFEFE8', // Off-white text color
                textAlign: 'center',
                flexGrow: 1,
                letterSpacing: '0.075em',
                fontWeight: 600,
                cursor: 'default',
                textShadow: `
                1px 1px 0 rgba(0, 0, 0, 0.4),
                -1px -1px 0 rgba(255, 255, 255, 0.15)
              `,
                // Slight stroke to add to the carved effect.
                WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.2)',
              }}
            >
              {title}
            </Typography>
          )}
          {customComponent}
        </Box>
        {location.pathname === '/books' && (
          <Box>
            <IconButton
              sx={{
                textShadow: `
      1px 1px 0 rgba(0, 0, 0, 0.4),
      -1px -1px 0 rgba(255, 255, 255, 0.15)
    `,
                color: '#EFEFE8',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon sx={{ fontSize: '2rem' }} />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
