import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { MdErrorOutline } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import SearchBar from '../SearchBar/SearchBar';
import SortDropdown from '../SortDropdown/SortDropdown';
import Cabinet from '../Cabinet/Cabinet';
import Book from '../Book/Book';
import PaginationControls from '../PaginationControls/PaginationControls';
import { validateSettings } from '../../utils/settings/validateSettings';
import './BookList.scss';

interface Book {
  folder: string;
  completion: number;
  metadata?: Record<string, string>;
}

const BookList: React.FC = () => {
  const { sessionExists, annotationType } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<
    'default' | 'incomplete' | 'complete'
  >('default');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadAllData = async () => {
      if (!sessionExists || !annotationType) return;

      setLoading(true);
      try {
        const loadedSettings =
          await window.electron.ipcRenderer.invoke('settings:load');
        const isValid = validateSettings(loadedSettings);

        if (!isValid) {
          alert('Invalid session settings. Please check your configuration.');
          navigate('/settings');
          return;
        }

        setSettings(loadedSettings);
        await loadBooks(loadedSettings);
      } catch (err) {
        console.error('Failed to load settings or books:', err);
      }
      setLoading(false);
    };

    loadAllData();
  }, [sessionExists, annotationType, location.pathname]);

  useEffect(() => {
    filterBooks();
  }, [searchTerm, books, sortOption]);

  const loadBooks = async (settings: any) => {
    const booksDir = settings.collectionsDir;
    if (!booksDir) {
      alert('No collections directory set in settings.');
      return;
    }

    const foldersWithCompletion = await window.electron.ipcRenderer.invoke(
      'getFoldersWithTxtFiles',
      booksDir,
    );

    let metadataJson: any = {};
    if (settings.isMetadataAvailable) {
      metadataJson = await window.electron.ipcRenderer.invoke('loadMetadata');
    }

    const booksWithMetadata = foldersWithCompletion.map(
      (folderObj: { folder: string; completion: number }) => ({
        folder: folderObj.folder,
        completion: folderObj.completion || 0,
        metadata: metadataJson[folderObj.folder] || {},
      }),
    );

    setBooks(booksWithMetadata);
    setFilteredBooks(booksWithMetadata);
    updatePagination(booksWithMetadata.length, settings.itemsPerPage);
  };

  const updatePagination = (totalBooks: number, itemsPerPage: string) => {
    const perPage = parseInt(itemsPerPage, 10) || 10;
    const pages = Math.ceil(totalBooks / perPage);
    setTotalPages(pages);
    if (currentPage > pages) {
      setCurrentPage(1);
    }
  };

  const filterBooks = () => {
    let filtered = [...books];
    if (searchTerm !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ({ folder, metadata }) =>
          folder.toLowerCase().includes(lowerSearch) ||
          Object.values(metadata || {}).some((value) =>
            value.toLowerCase().includes(lowerSearch),
          ),
      );
    }

    if (sortOption === 'incomplete') {
      filtered.sort((a, b) => (a.completion || 0) - (b.completion || 0));
    } else if (sortOption === 'complete') {
      filtered.sort((a, b) => (b.completion || 0) - (a.completion || 0));
    }

    setFilteredBooks(filtered);
    updatePagination(filtered.length, settings.itemsPerPage);
  };

  const getPaginatedBooks = () => {
    const itemsPerPage = parseInt(settings.itemsPerPage, 10) || 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(startIndex, startIndex + itemsPerPage);
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

  console.log('BOOKs:', books);

  return (
    <Container
      sx={{
        minHeight: '100%',
        width: '100%',
        fontFamily: 'Montserrat, sans-serif',
      }}
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
        <Box sx={{ minHeight: '100%', padding: '2rem 0' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <Box sx={{ width: '60%' }}>
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </Box>
            <SortDropdown value={sortOption} onChange={setSortOption} />
          </Box>

          {getPaginatedBooks().length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                margin: '15% 0',
                color: 'red',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <MdErrorOutline size={28} />
              <Typography variant="h6" sx={{ fontStyle: 'bold' }}>
                No volumes found for this annotation session.
              </Typography>
            </Box>
          ) : (
            <Cabinet>
              {getPaginatedBooks().map((book, index) => {
                console.log(`BOOKLIST: ${book.folder} = ${book.completion}%`);
                return (
                  <Book
                    key={index}
                    folder={book.folder}
                    completion={book.completion}
                    metadata={book.metadata}
                    metadataFields={settings.metadataFields}
                    onClick={() => handleBookClick(book.folder)}
                  />
                );
              })}
            </Cabinet>
          )}

          <PaginationControls
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onGoToPage={handleGoToPage}
          />
        </Box>
      )}
    </Container>
  );
};

export default BookList;
