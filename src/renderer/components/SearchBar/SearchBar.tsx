import React from 'react';
import { Box, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchBar: React.FC<Props> = ({ searchTerm, onSearchChange }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
      <Search sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
      <TextField
        variant="outlined"
        label="Search by Book ID or visible metadata"
        size="small"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        fullWidth
      />
    </Box>
  );
};

export default SearchBar;