import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Pagination,
  TextField,
  Button,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface Book {
  folder: string;
  completion: number;
  metadata?: Record<string, string>;
}

const BookList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [searchTerm, books]);

  const loadSettings = async () => {
    const loadedSettings =
      await window.electron.ipcRenderer.invoke('settings:load');
    setSettings(loadedSettings);
  };

  const loadBooks = async () => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    const booksDir = settings.booksDir;

    if (booksDir) {
      const foldersWithCompletion = await window.electron.ipcRenderer.invoke(
        'getFoldersWithTxtFiles',
        booksDir,
      );

      let metadataJson: any = {};
      if (settings.isMetadataAvailable) {
        metadataJson = await window.electron.ipcRenderer.invoke('loadMetadata');
      }

      const booksWithMetadata = foldersWithCompletion.map(
        (folderObj: { folder: string; completion: number }) => {
          const metadata = metadataJson[folderObj.folder] || {};
          return {
            folder: folderObj.folder,
            completion: folderObj.completion || 0,
            metadata,
          };
        },
      );

      setBooks(booksWithMetadata);
      setFilteredBooks(booksWithMetadata);
      updatePagination(booksWithMetadata.length, settings.booksPerPage);
    } else {
      alert('No books directory set in settings.');
    }
  };

  const updatePagination = (totalBooks: number, booksPerPage: string) => {
    const totalPages = Math.ceil(
      totalBooks / (parseInt(booksPerPage, 10) || 10),
    );
    setTotalPages(totalPages);
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  };

  const filterBooks = () => {
    if (searchTerm === '') {
      setFilteredBooks(books);
      updatePagination(books.length, settings.booksPerPage);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = books.filter(({ folder, metadata }) => {
        return (
          folder.toLowerCase().includes(lowerCaseSearchTerm) ||
          Object.values(metadata || {}).some((value) =>
            value.toLowerCase().includes(lowerCaseSearchTerm),
          )
        );
      });
      setFilteredBooks(filtered);
      updatePagination(filtered.length, settings.booksPerPage);
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
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      alert(`Please enter a valid page number between 1 and ${totalPages}.`);
    }
  };

  const handleBookClick = (folder: string) => {
    navigate(`/book/${folder}`);
  };

  const getPaginatedBooks = () => {
    const booksPerPage = parseInt(settings.booksPerPage, 10) || 10;
    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = Math.min(startIndex + booksPerPage, filteredBooks.length);
    return filteredBooks.slice(startIndex, endIndex);
  };

  return (
    <Container
      sx={{ padding: '2rem 5rem', fontFamily: 'Montserrat, sans-serif' }}
    >
      <Box sx={{ marginBottom: '4rem' }}>
        <Typography variant="h4" gutterBottom>
          List of Books
        </Typography>
        <TextField
          label="Search by Book ID or visible metadata..."
          onChange={(event) => setSearchTerm(event.target.value)}
          sx={{ marginBottom: '2rem', width: '100%' }}
          variant="outlined"
        />
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
          {getPaginatedBooks().map(
            ({ folder, completion, metadata }, index) => {
              const truncatedFolderName =
                folder.length > 20 ? `${folder.substring(0, 17)}...` : folder;

              const backgroundGradient = `linear-gradient(to top, #AFE1AF ${completion}%, #FCF5E5 0%)`;

              const tooltipContent =
                settings.metadataFields
                  ?.filter((field: any) => field.displayOnCover)
                  .map(
                    (field: any) =>
                      `<strong>${field.label}:</strong> ${
                        metadata?.[field.column]
                          ? metadata[field.column]
                          : 'N/A'
                      }`,
                  )
                  .join('<br />') || 'No metadata available';

              const displayedMetadata = settings.metadataFields?.filter(
                (field: any) => field.displayOnCover,
              );

              return (
                <Tooltip
                  title={
                    <span
                      dangerouslySetInnerHTML={{ __html: tooltipContent }}
                    />
                  }
                  arrow
                  placement="top"
                  key={index}
                >
                  <Box
                    sx={{
                      width: '10rem',
                      height: '12.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      perspective: '25rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleBookClick(folder)}
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
                          background: backgroundGradient,
                          transform: 'translateZ(-2.5rem)',
                          boxShadow: '-0.625rem 0 3.125rem 0.625rem lightgray',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          background: backgroundGradient,
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
                          {metadata && displayedMetadata?.length === 2 && (
                            <Typography
                              variant="body2"
                              sx={{
                                marginBottom: '0.25rem',
                                fontWeight: 600,
                              }}
                            >
                              {metadata[displayedMetadata[0].column]
                                ? `${metadata[displayedMetadata[0].column]?.slice(0, 25)}..`
                                : ''}
                            </Typography>
                          )}
                          <Typography
                            variant="body2"
                            sx={{ margin: '0.75rem 0', fontStyle: 'italic' }}
                          >
                            {truncatedFolderName}
                          </Typography>
                          {metadata &&
                            (displayedMetadata?.length !== 2
                              ? displayedMetadata?.map((field: any) => (
                                  <Typography
                                    key={field.column}
                                    variant="body2"
                                    sx={{
                                      marginBottom: '0.25rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {metadata[field.column]
                                      ? `${metadata[field.column]?.slice(0, 25)}..`
                                      : ''}
                                  </Typography>
                                ))
                              : metadata[displayedMetadata[1].column] && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      marginTop: '0.25rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {metadata[displayedMetadata[1].column]
                                      ? `${metadata[displayedMetadata[1].column]?.slice(0, 25)}..`
                                      : ''}
                                  </Typography>
                                ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Tooltip>
              );
            },
          )}
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
          InputProps={{ inputProps: { min: 1, max: totalPages } }}
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
