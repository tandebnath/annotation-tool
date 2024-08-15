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
  CircularProgress,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { ArrowBackOutlined } from '@mui/icons-material';

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

  const [settings, setSettings] = useState<any>({});

  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    setSettings(settings);
    setStates(settings.labels || []);
    setPagesPerAppPage(parseInt(settings.pagesPerAppPage, 10) || 1);
    setDefaultLabel(settings.defaultLabel || '');
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true); // Start loading

      await loadSettings();
      await loadBookDetails();
      await loadAnnotations();
      await loadVolumeNotes();

      setLoading(false); // Stop loading after everything is fetched
    };

    loadAllData();
  }, [bookId]);

  useEffect(() => {
    calculateBookCompletion();
  }, [pages, annotations, pagesPerAppPage]);

  const loadBookDetails = async () => {
    const loadedPages = await window.electron.ipcRenderer.invoke(
      'getBookContents',
      bookId,
    );
    setPages(loadedPages);

    const settingsData =
      await window.electron.ipcRenderer.invoke('settings:load');
    setSettings(settingsData);

    let metadataJson: any = {};
    if (settingsData.isMetadataAvailable) {
      metadataJson = await window.electron.ipcRenderer.invoke('loadMetadata');
    }

    if (bookId && metadataJson[bookId]) {
      setBookMetadata(metadataJson[bookId]);
    }

    // Adjust pagination based on booksPerPage
    const booksPerPage = parseInt(settingsData.booksPerPage, 10) || 1;
    const totalBookPages = Math.ceil(loadedPages.length / booksPerPage);
    setTotalPages(totalBookPages); // Set total pages based on the number of book pages divided by booksPerPage
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
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
          <Typography sx={{ marginTop: '1rem' }}>Loading...</Typography>
        </Box>
      ) : (
        <>
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: 0, // Remove padding to avoid oval shape
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 'none',
              },
              marginBottom: '1rem',
            }}
          >
            <ArrowBackOutlined sx={{ marginRight: '0.5rem' }} />
            <Typography variant="button">Back to Books</Typography>
          </IconButton>

          <Box sx={{ marginBottom: '2rem' }}>
            <Typography sx={{ fontSize: '1.25rem' }}>
              <strong>ID:</strong> {bookId}
            </Typography>
            {bookMetadata &&
              Object.keys(bookMetadata).length > 0 &&
              settings.metadataFields?.map(
                (field: { column: string; label: string }) => (
                  <Typography key={field.column} sx={{ fontSize: '1.25rem' }}>
                    <strong>{field.label}:</strong>{' '}
                    {bookMetadata?.[
                      field.column as keyof typeof bookMetadata
                    ] || 'N/A'}
                  </Typography>
                ),
              )}
          </Box>

          <Box sx={{ marginBottom: '2rem' }}>
            <Typography
              gutterBottom
              sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}
            >
              Progress
            </Typography>
            <Box
              sx={{
                width: '100%',
                backgroundColor: '#e0e0e0',
                borderRadius: '0.25rem',
              }}
            >
              <Box
                sx={{
                  width: `${bookCompletion}%`,
                  backgroundColor: '#AFE1AF',
                  color: 'black',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                {bookCompletion}%
              </Box>
            </Box>
          </Box>

          <Box sx={{ marginBottom: '2rem' }}>
            <Typography
              gutterBottom
              sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}
            >
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
                size="small"
                onClick={handleSaveNotes}
                sx={{ marginRight: '1rem', fontWeight: 'bold' }}
              >
                Save
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={handleClearNotes}
                sx={{ fontWeight: 'bold' }}
              >
                Clear
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <form onSubmit={handleRangeSubmit} style={{ display: 'flex' }}>
              <TextField
                label="From Page"
                type="number"
                size="small"
                value={fromPage}
                onChange={(e) => setFromPage(e.target.value)}
                sx={{ marginRight: '0.5rem' }}
                required
              />
              <TextField
                label="To Page"
                type="number"
                size="small"
                value={toPage}
                onChange={(e) => setToPage(e.target.value)}
                sx={{ marginRight: '0.5rem' }}
                required
              />
              <FormControl required sx={{ marginRight: '0.5rem' }}>
                {/* <InputLabel>Select Label</InputLabel> */}
                <Select
                  value={rangeState}
                  size="small"
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
              <Button
                type="submit"
                size="small"
                variant="contained"
                color="success"
                sx={{ fontWeight: 'bold' }}
              >
                Save
              </Button>
            </form>
          </Box>

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
              onClick={handleMarkAllAs}
            >
              Mark all as {defaultLabel}
            </Button>
          </Box>

          <hr />

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
              onClick={handleJumpToUnannotated}
              disabled={bookCompletion === 100}
            >
              Jump to Next Unannotated Page
            </Button>
          </Box>

          {paginatePages(currentPage).map((page, index) => (
            <React.Fragment key={index}>
              <Card sx={{ marginBottom: '2rem' }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: '#d70040', fontWeight: 'bold' }}
                  >
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
                        fontWeight: 'bold'
                      }}
                      onClick={() =>
                        handleAnnotationClick(page.fileName, state)
                      }
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
            shape="circular"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '7.5rem',
              '& .Mui-selected': {
                backgroundColor: '#13294B', // Set the background color of the selected page
                color: 'white',
              },
              '& .MuiPaginationItem-root': {
                '&:hover': {
                  backgroundColor: '#145ea8',
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
              InputProps={{ inputProps: { min: 1, max: totalPages } }}
              placeholder="Enter Page No."
              sx={{
                width: '10rem',
                marginRight: '0.5rem',
                textAlign: 'center',
              }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleGoToPage}
              sx={{ fontWeight: 'bold', backgroundColor: '#13294B' }}
            >
              Go to Page
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default BookDetails;
