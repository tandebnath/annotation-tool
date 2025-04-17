import React from 'react';
import { TextField, MenuItem, FormControl } from '@mui/material';

interface Props {
  value: 'default' | 'incomplete' | 'complete';
  onChange: (value: 'default' | 'incomplete' | 'complete') => void;
}

const SortDropdown: React.FC<Props> = ({ value, onChange }) => {
  return (
    <FormControl size="small">
      <TextField
        select
        label="Sort by"
        size="small"
        value={value}
        onChange={(e) =>
          onChange(e.target.value as 'default' | 'incomplete' | 'complete')
        }
      >
        <MenuItem value="default">Default Order</MenuItem>
        <MenuItem value="incomplete">Incomplete First</MenuItem>
        <MenuItem value="complete">Complete First</MenuItem>
      </TextField>
    </FormControl>
  );
};

export default SortDropdown;