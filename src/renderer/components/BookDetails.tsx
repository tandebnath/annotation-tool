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
  Pagination,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';

interface Annotation {
  bookId: any;
  page: string;
  state: string;
}

interface Page {
  fileName: string;
  content: string;
}

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
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagesPerAppPage, setPagesPerAppPage] = useState(1);
  const [defaultLabel, setDefaultLabel] = useState('');

  useEffect(() => {
    loadSettings();
    loadBookDetails();
    loadAnnotations();
    loadVolumeNotes();
  }, [bookId]);

  useEffect(() => {
    calculatePagination();
    calculateBookCompletion();
  }, [pages, annotations, pagesPerAppPage]);

  const loadSettings = async () => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    setStates(settings.labels || []);
    setPagesPerAppPage(parseInt(settings.pagesPerAppPage, 10) || 1);
    setDefaultLabel(settings.defaultLabel || '');
  };

  const loadBookDetails = async () => {
    setBookMetadata({
      title: 'Sample Book',
      author: 'Author Name',
      year: '2024',
    });

    const loadedPages = await window.electron.ipcRenderer.invoke(
      'getBookContents',
      bookId,
    );
    setPages(loadedPages);
  };

  const calculatePagination = () => {
    const totalAppPages = Math.ceil(pages.length / pagesPerAppPage);
    setTotalPages(totalAppPages);
  };

  const calculateBookCompletion = () => {
    const totalPages = pages.length;
    const labeledPages = annotations.length;
    const completionPercentage = Math.round((labeledPages / totalPages) * 100);
    setBookCompletion(completionPercentage);
  };

  const paginatePages = (page: number) => {
    const startIndex = (page - 1) * pagesPerAppPage;
    const endIndex = startIndex + pagesPerAppPage;
    return pages.slice(startIndex, endIndex);
  };

  const loadAnnotations = async () => {
    const loadedAnnotations = await window.electron.ipcRenderer.invoke(
      'loadAnnotations',
      bookId,
    );
    setAnnotations(loadedAnnotations);
  };

  const loadVolumeNotes = async () => {
    const loadedNotes = await window.electron.ipcRenderer.invoke(
      'loadVolumeNotes',
      bookId,
    );
    setVolumeNotes(loadedNotes);
  };

  const handleAnnotationClick = async (page: string, state: string) => {
    const existingAnnotation = annotations.find(
      (annotation) => annotation.page === page && annotation.state === state,
    );

    if (existingAnnotation) {
      const updatedAnnotations = annotations.filter(
        (annotation) =>
          !(annotation.page === page && annotation.state === state),
      );
      setAnnotations(updatedAnnotations);
      await window.electron.ipcRenderer.invoke('saveAnnotation', {
        bookId,
        page,
        state: '',
      });
    } else {
      const updatedAnnotations = annotations.filter(
        (annotation) => annotation.page !== page,
      );
      updatedAnnotations.push({ bookId, page, state });
      setAnnotations(updatedAnnotations);
      await window.electron.ipcRenderer.invoke('saveAnnotation', {
        bookId,
        page,
        state,
      });
    }
  };

  const isStateActive = (page: string, state: string) => {
    return annotations.some(
      (annotation) => annotation.page === page && annotation.state === state,
    );
  };

  const handleSaveNotes = async () => {
    await window.electron.ipcRenderer.invoke('saveVolumeNotes', {
      bookId,
      note: volumeNotes,
    });
    alert('Volume note saved!');
  };

  const handleClearNotes = async () => {
    await window.electron.ipcRenderer.invoke('clearVolumeNotes', bookId);
    setVolumeNotes('');
    alert('Volume note cleared!');
  };

  const handleRangeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const from = parseInt(fromPage, 10);
    const to = parseInt(toPage, 10);

    if (!from || !to || !rangeState) {
      alert('Please select all values');
      return;
    }

    if (from > to) {
      alert('The "From Page" cannot be greater than "To Page".');
      return;
    }

    const pagesInRange = pages
      .filter(
        (page) =>
          parseInt(page.fileName.replace('.txt', ''), 10) >= from &&
          parseInt(page.fileName.replace('.txt', ''), 10) <= to,
      )
      .map((page) => page.fileName);

    const newAnnotations = pagesInRange.map((page) => ({
      bookId,
      page,
      state: rangeState,
    }));

    const updatedAnnotations = [...annotations, ...newAnnotations];
    setAnnotations(updatedAnnotations);

    for (const annotation of newAnnotations) {
      await window.electron.ipcRenderer.invoke('saveAnnotation', annotation);
    }

    alert(`Pages from ${fromPage} to ${toPage} marked as ${rangeState}.`);
  };

  const handleMarkAllAs = async () => {
    const unannotatedPages = pages.filter(
      (page) =>
        !annotations.some((annotation) => annotation.page === page.fileName),
    );

    const newAnnotations = unannotatedPages.map((page) => ({
      bookId,
      page: page.fileName,
      state: defaultLabel,
    }));

    const updatedAnnotations = [...annotations, ...newAnnotations];
    setAnnotations(updatedAnnotations);

    for (const annotation of newAnnotations) {
      await window.electron.ipcRenderer.invoke('saveAnnotation', annotation);
    }
  };

  const handleJumpToUnannotated = () => {
    const firstUnannotatedPage = pages.findIndex(
      (page) =>
        !annotations.some((annotation) => annotation.page === page.fileName),
    );

    if (firstUnannotatedPage !== -1) {
      const newPage = Math.ceil((firstUnannotatedPage + 1) / pagesPerAppPage);
      setCurrentPage(newPage);
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
        <Typography>
          <strong>Title:</strong> {bookMetadata.title}
        </Typography>
        <Typography>
          <strong>Author:</strong> {bookMetadata.author}
        </Typography>
        <Typography>
          <strong>Year:</strong> {bookMetadata.year}
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
        <Button variant="contained" color="warning" onClick={handleMarkAllAs}>
          Mark all as {defaultLabel}
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
          disabled={bookCompletion === 100}
        >
          Jump to Next Unannotated Work
        </Button>
      </Box>

      {paginatePages(currentPage).map((page, index) => (
        <React.Fragment key={index}>
          <Card sx={{ marginBottom: '2rem' }}>
            <CardContent>
              <Typography variant="h6">
                Page {parseInt(page.fileName.replace('.txt', ''), 10)}
              </Typography>
              <pre>{page.content}</pre>
            </CardContent>
            <CardActions>
              {states.map((state, idx) => (
                <Button
                  key={idx}
                  variant="contained"
                  sx={{
                    backgroundColor: isStateActive(page.fileName, state)
                      ? '#AFE1AF'
                      : '#E5E4E2',
                    color: 'black',
                    marginRight: '0.5rem',
                  }}
                  onClick={() => handleAnnotationClick(page.fileName, state)}
                >
                  {state}
                </Button>
              ))}
            </CardActions>
          </Card>
          {index % 2 !== 0 && <Divider sx={{ marginBottom: '2rem' }} />}
        </React.Fragment>
      ))}

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

export default BookDetails;
