import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Pagination, // <-- Importing Pagination component here
} from '@mui/material';

const BookDetails: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [bookMetadata, setBookMetadata] = useState({
    title: '',
    author: '',
    year: '',
  });
  const [bookCompletion, setBookCompletion] = useState(0);
  const [volumeNotes, setVolumeNotes] = useState('');
  const [fromPage, setFromPage] = useState('');
  const [toPage, setToPage] = useState('');
  const [rangeState, setRangeState] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [pages, setPages] = useState<{ name: string; content: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesPerAppPage, setPagesPerAppPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBookDetails();
  }, [bookId, currentPage]);

  const loadBookDetails = async () => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    const { booksDir, pagesPerAppPage: pagesPerPageSetting, labels } = settings;

    setPagesPerAppPage(pagesPerPageSetting || 1);
    setStates(labels || []);

    const bookContents = await window.electron.ipcRenderer.invoke(
      'getBookContents',
      `${booksDir}/${bookId}`,
    );

    if (bookContents.length) {
      setPages(bookContents);
      const total = Math.ceil(bookContents.length / pagesPerAppPage);
      setTotalPages(total);
    }
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  const handleSaveNotes = () => {
    alert('Notes saved!');
  };

  const handleClearNotes = () => {
    setVolumeNotes('');
  };

  const handleRangeSubmit = () => {
    alert('Range annotation saved!');
  };

  const handleMarkAllAs = (state: string) => {
    alert(`All marked as ${state}`);
  };

  const handleJumpToUnannotated = () => {
    alert('Jumped to next unannotated work');
  };

  return (
    <Container
      sx={{ padding: '2rem 5rem', fontFamily: 'Montserrat, sans-serif' }}
    >
      <Button
        variant="outlined"
        onClick={() => navigate('/')}
        sx={{ marginBottom: '1rem' }}
      >
        Back to Books
      </Button>

      <Box sx={{ marginBottom: '2rem' }}>
        <Typography variant="h5" gutterBottom>
          Book Details
        </Typography>
        <Typography>
          <strong>ID:</strong> {bookId}
        </Typography>
      </Box>

      <Box sx={{ marginBottom: '2rem' }}>
        <Typography variant="h6" gutterBottom>
          Progress
        </Typography>
        <Box
          sx={{
            width: '100%',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
          }}
        >
          <Box
            sx={{
              width: `${bookCompletion}%`,
              backgroundColor: '#AFE1AF',
              color: 'black',
              padding: '0.5rem',
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {bookCompletion}%
          </Box>
        </Box>
      </Box>

      <Box sx={{ marginBottom: '2rem' }}>
        <Typography variant="h6" gutterBottom>
          Volume Notes
        </Typography>
        <TextField
          multiline
          rows={3}
          variant="outlined"
          fullWidth
          value={volumeNotes}
          onChange={(e) => setVolumeNotes(e.target.value)}
        />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '1rem',
          }}
        >
          <Button
            variant="contained"
            color="success"
            onClick={handleSaveNotes}
            sx={{ marginRight: '1rem' }}
          >
            Save
          </Button>
          <Button variant="contained" color="error" onClick={handleClearNotes}>
            Clear
          </Button>
        </Box>
      </Box>

      <Box
        sx={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
      >
        <form onSubmit={handleRangeSubmit} style={{ display: 'flex' }}>
          <TextField
            label="From Page"
            type="number"
            value={fromPage}
            onChange={(e) => setFromPage(e.target.value)}
            sx={{ marginRight: '0.5rem' }}
            required
          />
          <TextField
            label="To Page"
            type="number"
            value={toPage}
            onChange={(e) => setToPage(e.target.value)}
            sx={{ marginRight: '0.5rem' }}
            required
          />
          <FormControl required sx={{ marginRight: '0.5rem' }}>
            <InputLabel>Select Label</InputLabel>
            <Select
              value={rangeState}
              onChange={(e) => setRangeState(e.target.value as string)}
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
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
          <Button type="submit" variant="contained" color="success">
            Save
          </Button>
        </form>
      </Box>

      <Box
        sx={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
      >
        <Button
          variant="contained"
          color="warning"
          onClick={() => handleMarkAllAs('Read')}
        >
          Mark all as Read
        </Button>
      </Box>

      <hr />

      <Box
        sx={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleJumpToUnannotated}
        >
          Jump to Next Unannotated Work
        </Button>
      </Box>

      {/* Pagination logic and display */}
      <Box sx={{ marginBottom: '2rem' }}>
        {pages
          .slice(
            (currentPage - 1) * pagesPerAppPage,
            currentPage * pagesPerAppPage,
          )
          .map((page, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'start',
                marginBottom: '1rem',
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'white',
                  color: '#d70040',
                  fontWeight: 'bold',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginRight: '1rem',
                }}
              >
                {page.name.replace('.txt', '')}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <pre>{page.content}</pre>
                <Box sx={{ display: 'flex' }}>
                  {states.map((state, index) => (
                    <Button
                      key={index}
                      variant="contained"
                      sx={{
                        backgroundColor: '#E5E4E2',
                        color: 'black',
                        marginRight: '0.5rem',
                        '&.active': {
                          backgroundColor: '#AFE1AF',
                        },
                      }}
                      onClick={() => {
                        // Handle state change for this page
                      }}
                    >
                      {state}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>
          ))}
      </Box>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        variant="outlined"
        shape="rounded"
        sx={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}
      />
    </Container>
  );
};

export default BookDetails;
