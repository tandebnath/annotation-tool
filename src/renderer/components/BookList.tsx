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
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [settings, setSettings] = useState<any>({});

  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadBooks(currentPage);
  }, [currentPage]);

  const loadSettings = async () => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    setSettings(settings);
  };

  const loadBooks = async (page: number) => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    const booksDir = settings.booksDir;
    const booksPerPage = parseInt(settings.booksPerPage, 10) || 10;

    if (booksDir) {
      const foldersWithCompletion = await window.electron.ipcRenderer.invoke(
        'getFoldersWithTxtFiles',
        booksDir,
      );

      let metadataJson: any = {};
      if (settings.isMetadataAvailable) {
        metadataJson = await window.electron.ipcRenderer.invoke('loadMetadata');
      }

      const totalBooks = foldersWithCompletion.length;
      const totalPages = Math.ceil(totalBooks / booksPerPage);

      setTotalPages(totalPages);
      setMaxPage(totalPages);

      const startIndex = (page - 1) * booksPerPage;
      const endIndex = Math.min(startIndex + booksPerPage, totalBooks);
      const paginatedFolders = foldersWithCompletion.slice(
        startIndex,
        endIndex,
      );

      setBooks(
        paginatedFolders.map(
          (folderObj: { folder: string; completion: number }) => {
            const metadata = metadataJson[folderObj.folder] || {};
            return {
              folder: folderObj.folder,
              completion: folderObj.completion || 0,
              metadata,
            };
          },
        ),
      );
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

  const handleBookClick = (folder: string) => {
    navigate(`/book/${folder}`);
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
          {books.map(({ folder, completion, metadata }, index) => {
            const truncatedFolderName =
              folder.length > 20 ? `${folder.substring(0, 17)}...` : folder;

            const backgroundGradient = `linear-gradient(to top, #AFE1AF ${completion}%, #FCF5E5 0%)`;

            // Combine metadata into a single string for the tooltip content with line breaks and bold labels
            const tooltipContent =
              settings.metadataFields
                ?.filter((field: any) => field.displayOnCover)
                .map(
                  (field: any) =>
                    `<strong>${field.label}:</strong> ${
                      metadata?.[field.column] ? metadata[field.column] : 'N/A'
                    }`,
                )
                .join('<br />') || 'No metadata available';

            // Get the fields to display on cover
            const displayedMetadata = settings.metadataFields?.filter(
              (field: any) => field.displayOnCover,
            );

            return (
              <Tooltip
                title={
                  <span dangerouslySetInnerHTML={{ __html: tooltipContent }} />
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
                  onClick={() => handleBookClick(folder)} // Navigate to the book details page
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
