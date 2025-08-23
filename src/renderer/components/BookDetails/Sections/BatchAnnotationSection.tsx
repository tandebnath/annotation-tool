import React from 'react';
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

interface BatchAnnotationProps {
  fromPage: string;
  toPage: string;
  rangeState: string;
  states: string[];
  markAllAsLabel: string; 
  bookCompletion: number;
  onRangeChange: (key: 'from' | 'to' | 'label', value: string) => void;
  onRangeSubmit: (e: React.FormEvent) => void;
  onMarkAllAs: () => void;
  onJumpToUnannotated: () => void;
}

const BatchAnnotationSection: React.FC<BatchAnnotationProps> = ({
  fromPage,
  toPage,
  rangeState,
  states,
  markAllAsLabel,
  bookCompletion,
  onRangeChange,
  onRangeSubmit,
  onMarkAllAs,
  onJumpToUnannotated,
}) => {
  return (
    <>
      {/* Annotate in a Range */}
      <Box
        sx={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <form onSubmit={onRangeSubmit} style={{ display: 'flex' }}>
          <TextField
            label="From Page"
            type="number"
            size="small"
            value={fromPage}
            onChange={(e) => onRangeChange('from', e.target.value)}
            sx={{ marginRight: '0.5rem' }}
            required
          />
          <TextField
            label="To Page"
            type="number"
            size="small"
            value={toPage}
            onChange={(e) => onRangeChange('to', e.target.value)}
            sx={{ marginRight: '0.5rem' }}
            required
          />
          <FormControl required sx={{ marginRight: '0.5rem' }}>
            <Select
              value={rangeState}
              size="small"
              onChange={(e) => onRangeChange('label', e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Select label' }}
            >
              <MenuItem value="" disabled>
                Select Label
              </MenuItem>
              {states.map((state, index) => (
                <MenuItem key={index} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            type="submit"
            size="small"
            variant="contained"
            sx={{
              fontWeight: 'bold',
              backgroundColor: 'var(--proceed-color)',
              '&:hover': {
                backgroundColor: 'var(--proceed-hover)',
              },
              '&:active': {
                backgroundColor: 'var(--proceed-active)',
              },
            }}
          >
            Save
          </Button>
        </form>
      </Box>

      {/* Mark All */}
      <Box
        sx={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={onMarkAllAs}
          disabled={!markAllAsLabel}
          sx={{
            backgroundColor: 'var(--secondary-main)',
            '&:hover': {
              backgroundColor: 'var(--secondary-hover)',
            },
            '&:active': {
              backgroundColor: 'var(--secondary-active)',
            },
          }}
        >
          Mark all as {markAllAsLabel}
        </Button>
      </Box>

      {/* Jump to Unannotated */}
      <Box
        sx={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={onJumpToUnannotated}
          disabled={bookCompletion === 100}
          sx={{
            fontWeight: 'bold',
            backgroundColor: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--secondary-hover)',
            },
          }}
        >
          Jump to Next Unannotated Page
        </Button>
      </Box>
    </>
  );
};

export default BatchAnnotationSection;
