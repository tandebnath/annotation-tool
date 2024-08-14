import React, { useEffect, useState } from 'react';
import {
  Container,
  Button,
  Box,
  Typography,
  Pagination,
  TextField,
} from '@mui/material';

const BookList: React.FC = () => {
  const [books, setBooks] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);

  useEffect(() => {
    loadBooks(currentPage);
  }, [currentPage]);

  const loadBooks = async (page: number) => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    const booksDir = settings.booksDir;
    const booksPerPage = parseInt(settings.booksPerPage, 10) || 10;

    if (booksDir) {
      const folders = await window.electron.ipcRenderer.invoke(
        'getFoldersWithTxtFiles',
        booksDir,
      );

      const totalBooks = folders.length;
      const totalPages = Math.ceil(totalBooks / booksPerPage);

      setTotalPages(totalPages);
      setMaxPage(totalPages);

      const startIndex = (page - 1) * booksPerPage;
      const endIndex = Math.min(startIndex + booksPerPage, totalBooks);
      const paginatedFolders = folders.slice(startIndex, endIndex);

      setBooks(paginatedFolders);
    } else {
      alert('No books directory set in settings.');
    }
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  const handleGoToPage = () => {
    const pageInput = (document.getElementById('pageInput') as HTMLInputElement)
      .value;
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= maxPage) {
      setCurrentPage(page);
    } else {
      alert(`Please enter a valid page number between 1 and ${maxPage}.`);
    }
  };

  return (
    <Container
      sx={{ padding: '2rem 5rem', fontFamily: 'Montserrat, sans-serif' }}
    >
      <Box sx={{ marginBottom: '4rem' }}>
        <Typography variant="h4" gutterBottom>
          List of Books
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: '4rem',
            rowGap: '5rem',
            justifyContent: 'center',
            marginTop: '2rem',
          }}
        >
          {books.map((folder, index) => {
            const truncatedFolderName =
              folder.length > 20 ? `${folder.substring(0, 17)}...` : folder;

            return (
              <Box
                key={index}
                sx={{
                  width: '10rem',
                  height: '12.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  perspective: '25rem',
                  cursor: 'pointer',
                }}
              >
                <Box
                  sx={{
                    transform: 'rotateY(-30deg)',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    width: '10rem',
                    height: '12.5rem',
                    transition: 'transform 1s ease',
                    '&:hover': {
                      transform: 'rotateY(0deg)',
                    },
                    '& > :first-of-type': {
                      position: 'absolute',
                      width: '10rem',
                      height: '12.5rem',
                      borderTopRightRadius: '0.1875rem',
                      borderBottomRightRadius: '0.1875rem',
                      boxShadow: '0.3125rem 0.3125rem 1.25rem lightgray',
                    },
                    '&::before': {
                      content: '""',
                      background: '#fff',
                      height: 'calc(12.5rem - 2 * 0.1875rem)',
                      width: '2.5rem',
                      top: '0.1875rem',
                      position: 'absolute',
                      transform:
                        'translateX(calc(10rem - 2.5rem / 2 - 0.1875rem)) rotateY(90deg) translateX(calc(2.5rem / 2))',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: '0',
                      width: '10rem',
                      height: '12.5rem',
                      borderTopRightRadius: '0.1875rem',
                      borderBottomRightRadius: '0.1875rem',
                      background: '#fcf5e5',
                      transform: 'translateZ(-2.5rem)',
                      boxShadow: '-0.625rem 0 3.125rem 0.625rem lightgray',
                    },
                  }}
                >
                  <Box
                    sx={{
                      background: 'linear-gradient(to top, #AFE1AF, #FCF5E5)',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'black',
                        zIndex: 1,
                        padding: '1.25rem',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2">
                        {truncatedFolderName}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        variant="outlined"
        shape="rounded"
        sx={{ display: 'flex', justifyContent: 'center', marginTop: '7.5rem' }}
      />

      <Box
        sx={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}
      >
        <TextField
          id="pageInput"
          type="number"
          InputProps={{ inputProps: { min: 1, max: maxPage } }}
          placeholder="Enter Page No."
          sx={{ width: '10rem', marginRight: '0.5rem', textAlign: 'center' }}
        />
        <Button variant="contained" onClick={handleGoToPage}>
          Go to Page
        </Button>
      </Box>
    </Container>
  );
};

export default BookList;
