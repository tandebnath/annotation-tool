import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
  navigateTo?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  onClick,
  navigateTo,
}) => {
  const navigate = useNavigate();

  if (onClick && navigateTo) {
    console.warn(
      'BackButton: Pass either `onClick` or `navigateTo`, not both.'
    );
  }

  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: 'fit-content',
        cursor: 'pointer',
        px: '0.75rem',
        py: '0.5rem',
        borderRadius: '0.5rem',
        color: 'var(--text-color)',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'var(--accent-color)',
          border: '1px solid var(--accent-color)',
        },
      }}
    >
      <ArrowBackIcon sx={{ fontSize: '1.5rem', mr: 1 }} />
      <Typography variant="subtitle1" fontWeight="medium">
        {label}
      </Typography>
    </Box>
  );
};

export default BackButton;