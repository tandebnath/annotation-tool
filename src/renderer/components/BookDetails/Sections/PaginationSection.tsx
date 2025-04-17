import React from 'react';
import { Box, Pagination, TextField, Button } from '@mui/material';

interface PaginationSectionProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  onGoToPage: (page: number) => void;
}

const PaginationSection: React.FC<PaginationSectionProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  onGoToPage,
}) => {
  const handleGoToPageClick = () => {
    const input = document.getElementById('pageInput') as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (page >= 1 && page <= totalPages) {
      onGoToPage(page);
    } else {
      alert(`Please enter a valid page number between 1 and ${totalPages}.`);
    }
  };

  return (
    <>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={onPageChange}
        variant="outlined"
        shape="circular"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '6rem',
          '& .Mui-selected': {
            backgroundColor: 'var(--text-color) !important',
            color: 'white',
          },
          '& .MuiPaginationItem-root': {
            '&:hover': {
              backgroundColor: 'var(--secondary-hover)',
              color: 'white',
            },
          },
        }}
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '2rem',
        }}
      >
        <TextField
          id="pageInput"
          type="number"
          size="small"
          placeholder="Enter Page No."
          InputProps={{
            inputProps: { min: 1, max: totalPages },
          }}
          sx={{
            width: '10rem',
            marginRight: '0.5rem',
            textAlign: 'center',
          }}
        />
        <Button
          size="small"
          variant="contained"
          onClick={handleGoToPageClick}
          sx={{
            fontWeight: 'bold',
            backgroundColor: 'var(--text-color)',
            '&:hover': {
              backgroundColor: 'var(--secondary-hover)',
            },
          }}
        >
          Go to Page
        </Button>
      </Box>
    </>
  );
};

export default PaginationSection;