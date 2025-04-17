import React from 'react';
import { Box, Pagination, TextField, Button } from '@mui/material';

interface Props {
  totalPages: number;
  currentPage: number;
  onPageChange: (value: number) => void;
  onGoToPage: (value: number) => void;
}

const PaginationControls: React.FC<Props> = ({
  totalPages,
  currentPage,
  onPageChange,
  onGoToPage,
}) => {
  const handleInput = () => {
    const val = document.getElementById('pageInput') as HTMLInputElement;
    const page = parseInt(val.value);
    if (!isNaN(page)) onGoToPage(page);
  };

  return (
    <>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(_, value) => onPageChange(value)}
        variant="outlined"
        shape="circular"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          // marginTop: '7.5rem',
          '& .Mui-selected': {
            backgroundColor: '#13294B !important',
            color: 'white',
          },
          '& .MuiPaginationItem-root:hover': {
            backgroundColor: '#145ea8',
            color: 'white',
          },
        }}
      />
      <Box
        sx={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}
      >
        <TextField
          id="pageInput"
          type="number"
          size="small"
          InputProps={{ inputProps: { min: 1, max: totalPages } }}
          placeholder="Enter Page No."
          sx={{ width: '10rem', marginRight: '0.5rem', textAlign: 'center' }}
        />
        <Button
          size="small"
          variant="contained"
          onClick={handleInput}
          sx={{ fontWeight: 'bold', backgroundColor: '#13294B' }}
        >
          Go to Page
        </Button>
      </Box>
    </>
  );
};

export default PaginationControls;
