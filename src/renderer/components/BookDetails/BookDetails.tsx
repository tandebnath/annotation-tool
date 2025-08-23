import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBackOutlined } from '@mui/icons-material';
import ContentSection from './Sections/ContentSection';
import PaginationSection from './Sections/PaginationSection';
import BatchAnnotationSection from './Sections/BatchAnnotationSection';
import BookNotesSection from './Sections/BookNotesSection';
import BookProgressSection from './Sections/BookProgressSection';
import BackButton from '../BackButton/BackButton';

interface Annotation {
  bookId: any;
  page: string;
  state: string;
  category: string;
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
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [markAllAsLabel, setMarkAllAsLabel] = useState('');

  const [settings, setSettings] = useState<any>({});

  const [loading, setLoading] = useState(true);

  const [annotationType, setAnnotationType] = useState<'prose' | 'poetry' | ''>(
    '',
  );

  // Dynamically add labels
  const [openLabelModal, setOpenLabelModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [persistLabel, setPersistLabel] = useState(false);

  const [usedLabels, setUsedLabels] = useState<
    Record<string, Record<string, string[]>>
  >({});

  useEffect(() => {
    const fetchAnnotationType = async () => {
      try {
        if (annotationType) return; // Prevent re-fetching if already set
        console.log('RENDERER: Invoking settings:getAnnotationType...');
        const type = await window.electron.ipcRenderer.invoke(
          'settings:getAnnotationType',
        );
        console.log('RENDERER: Annotation Type Retrieved:', type);
        setAnnotationType(type);
      } catch (error) {
        console.error('RENDERER: Error retrieving annotation type:', error);
      }
    };

    fetchAnnotationType();
  }, []);

  const loadSettings = async () => {
    const settings = await window.electron.ipcRenderer.invoke('settings:load');
    setSettings(settings);

    // Handle both 'labels' and labelCategories
    if (settings.labelCategories) {
      const allLabels = settings.labelCategories.flatMap((c: any) => c.labels);
      setStates(allLabels);
    } else {
      setStates(settings.labels || []);
    }

    setItemsPerPage(parseInt(settings.itemsPerPage, 10) || 1);
    setMarkAllAsLabel(settings.markAllAsLabel || '');
  };

  useEffect(() => {
    // const loadSettings = async () => {
    //   try {
    //     const loadedSettings =
    //       await window.electron.ipcRenderer.invoke('settings:load');
    //     console.log('LOADED SETTINGS:', loadedSettings);
    //     setSettings(loadedSettings);
    //   } catch (error) {
    //     console.error('ERROR LOADING SETTINGS:', error);
    //   }
    // };

    if (annotationType) {
      loadSettings();
    }
  }, [annotationType]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!annotationType) {
        console.log(
          'RENDERER: Skipping loadAllData() - Annotation Type not yet set.',
        );
        return; // Prevents running until annotationType is set
      }

      setLoading(true);
      console.log('RENDERER: Using annotationType:', annotationType);

      try {
        await loadSettings();
        await loadBookDetails();
        await loadAnnotations();
        await loadVolumeNotes();
        try {
          const result = await window.electron.ipcRenderer.invoke(
            'annotations:getUsedLabels',
          );
          setUsedLabels(result || {});
        } catch (e) {
          console.warn('Failed to load used labels:', e);
        }
      } catch (error) {
        console.error('RENDERER: Error loading data:', error);
      }

      setLoading(false);
    };

    loadAllData();
  }, [bookId, annotationType]); // Now waits until annotationType is available

  useEffect(() => {
    if (annotationType) {
      calculateBookCompletion();
    }
  }, [annotationType, pages, annotations, itemsPerPage]);

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
    const itemsPerPage = parseInt(settingsData.itemsPerPage, 10) || 1;
    const totalBookPages = Math.ceil(loadedPages.length / itemsPerPage);
    setTotalPages(totalBookPages); // Set total pages based on the number of book pages divided by booksPerPage
  };

  

  const calculateBookCompletion = () => {
    if (!annotationType) return;

    if (annotationType === 'prose') {
      // Prose: Completion is based on the number of labeled pages
      const totalPages = pages.length;
      const labeledPages = annotations.length;
      const completionPercentage = totalPages
        ? Math.round((labeledPages / totalPages) * 100)
        : 0;
      setBookCompletion(completionPercentage);
      console.log(
        `DETAILS: Completion for ${bookId} = ${completionPercentage}%`,
      );
    } else if (annotationType === 'poetry') {
      // Poetry: Completion is based on the number of categories with at least one label selected
      if (!settings.labelCategories || settings.labelCategories.length === 0) {
        setBookCompletion(0);
        return;
      }

      const totalCategories = settings.labelCategories.length;
      let selectedCategoriesCount = 0;

      settings.labelCategories.forEach(
        (category: { name: string; labels: string[] }) => {
          const hasSelection = annotations.some((annotation) =>
            category.labels.includes(annotation.state),
          );

          if (hasSelection) {
            selectedCategoriesCount += 1;
          }
        },
      );

      const completionPercentage = Math.round(
        (selectedCategoriesCount / totalCategories) * 100,
      );

      setBookCompletion(completionPercentage);
      console.log(
        `DETAILS: Completion for ${bookId} = ${completionPercentage}%`,
      );
    }
  };

  const paginatePages = (page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pages.slice(startIndex, endIndex);
  };

  const loadAnnotations = async () => {
    const loadedAnnotations = await window.electron.ipcRenderer.invoke(
      'loadAnnotations',
      { bookId },
    );
    setAnnotations(loadedAnnotations);
  };

  const loadVolumeNotes = async () => {
    const loadedNotes = await window.electron.ipcRenderer.invoke('loadNotes', {
      bookId,
    });
    setVolumeNotes(loadedNotes);
  };

  const handleAnnotationClick = async (
    page: string,
    state: string,
    category: string,
  ) => {
    const existingAnnotation = annotations.find(
      (annotation) =>
        annotation.page === page &&
        annotation.state === state &&
        annotation.category === category,
    );

    const resolvedPage = annotationType === 'poetry' ? 'poetry' : page;

    if (existingAnnotation) {
      const updatedAnnotations = annotations.filter(
        (annotation) =>
          !(
            annotation.page === resolvedPage &&
            annotation.state === state &&
            annotation.category === category
          ),
      );
      setAnnotations(updatedAnnotations);
      await window.electron.ipcRenderer.invoke('saveAnnotation', {
        type: annotationType,
        bookId,
        page: resolvedPage,
        state: '',
        category,
      });
    } else {
      let updatedAnnotations;

      if (annotationType === 'poetry' && settings.allowMultipleLabels) {
        updatedAnnotations = [
          ...annotations,
          { bookId, page: resolvedPage, state, category },
        ];
      } else if (annotationType === 'poetry' && !settings.allowMultipleLabels) {
        updatedAnnotations = annotations.filter(
          (annotation) =>
            annotation.page !== resolvedPage ||
            annotation.category !== category,
        );
        updatedAnnotations.push({
          bookId,
          page: resolvedPage,
          state,
          category,
        });
      } else {
        updatedAnnotations = annotations.filter(
          (annotation) => annotation.page !== resolvedPage,
        );
        updatedAnnotations.push({
          bookId,
          page: resolvedPage,
          state,
          category,
        });
      }

      setAnnotations(updatedAnnotations);

      await window.electron.ipcRenderer.invoke('saveAnnotation', {
        type: annotationType,
        bookId,
        page: resolvedPage,
        state,
        category,
      });
    }
  };

  const isStateActive = (page: string, state: string, category: string) => {
    return annotations.some((annotation) => {
      const pageToCompare = annotationType === 'poetry' ? 'poetry' : page;
      return (
        annotation.page === pageToCompare &&
        annotation.state === state &&
        annotation.category === category
      );
    });
  };

  const handleSaveNotes = async () => {
    await window.electron.ipcRenderer.invoke('saveNotes', {
      bookId,
      note: volumeNotes,
    });
    alert('Volume note saved!');
  };

  const handleClearNotes = async () => {
    await window.electron.ipcRenderer.invoke('clearNotes', { bookId });
    setVolumeNotes('');
    alert('Volume note cleared!');
  };

  const handleRangeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const from = parseInt(fromPage, 10);
    const to = parseInt(toPage, 10);

    if (!from || !to || !rangeState || !selectedCategory) {
      alert('Please select all values including category.');
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
      category: selectedCategory,
    }));

    const updatedAnnotations = [...annotations, ...newAnnotations];
    setAnnotations(updatedAnnotations);

    for (const annotation of newAnnotations) {
      await window.electron.ipcRenderer.invoke('saveAnnotation', {
        ...annotation,
        type: annotationType,
      });
    }

    alert(`Pages from ${fromPage} to ${toPage} marked as ${rangeState}.`);
  };

  const handleMarkAllAs = async () => {

    if (!markAllAsLabel || !selectedCategory) {
      alert('Please select a "Mark all as" label and category.');
      return;
    }

    const unannotatedPages = pages.filter(
      (page) =>
        !annotations.some((annotation) => annotation.page === page.fileName),
    );


    const newAnnotations = unannotatedPages.map((page) => ({
      bookId,
      page: page.fileName,
      state: markAllAsLabel,
      category: selectedCategory,
    }));

    const updatedAnnotations = [...annotations, ...newAnnotations];
    setAnnotations(updatedAnnotations);

    for (const annotation of newAnnotations) {
      await window.electron.ipcRenderer.invoke('saveAnnotation', {
        ...annotation,
        type: annotationType,
      });
    }
    alert(
      `Marked ${newAnnotations.length} unannotated pages as "${markAllAsLabel}" in category "${selectedCategory}".`,
    );

  };

  const handleJumpToUnannotated = () => {
    const firstUnannotatedPage = pages.findIndex(
      (page) =>
        !annotations.some((annotation) => annotation.page === page.fileName),
    );

    if (firstUnannotatedPage !== -1) {
      const newPage = Math.ceil((firstUnannotatedPage + 1) / itemsPerPage);
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

  const handleAddLabel = async () => {
    if (!newLabel.trim() || !selectedCategory) return;

    // Update the local UI state immediately (labelCategories only)
    setSettings((prevSettings: any) => {
      const updatedSettings = { ...prevSettings };
      const categoryIndex = updatedSettings.labelCategories?.findIndex(
        (c: { name: string }) => c.name === selectedCategory,
      );

      if (categoryIndex !== -1) {
        const labels = updatedSettings.labelCategories[categoryIndex].labels;
        if (!labels.includes(newLabel)) {
          updatedSettings.labelCategories[categoryIndex].labels = [
            ...labels,
            newLabel,
          ];
        }
      }

      return updatedSettings;
    });

    // Update states (used for BatchAnnotationSection)
    setStates((prevStates) =>
      prevStates.includes(newLabel) ? prevStates : [...prevStates, newLabel],
    );

    // Persist label globally if checked
    if (persistLabel) {
      const updatedSettings =
        await window.electron.ipcRenderer.invoke('settings:load');

      const categoryIndex = updatedSettings.labelCategories?.findIndex(
        (c: { name: string }) => c.name === selectedCategory,
      );

      if (categoryIndex !== -1) {
        const labels = updatedSettings.labelCategories[categoryIndex].labels;
        if (!labels.includes(newLabel)) {
          updatedSettings.labelCategories[categoryIndex].labels = [
            ...labels,
            newLabel,
          ];
        }

        await window.electron.ipcRenderer.invoke('settings:save', {
          annotationType,
          settings: updatedSettings,
        });
      }
    }

    setOpenLabelModal(false);
    setNewLabel('');
  };

  const handleRangeChange = (key: 'from' | 'to' | 'label', value: string) => {
    if (key === 'from') setFromPage(value);
    else if (key === 'to') setToPage(value);
    else if (key === 'label') setRangeState(value);
  };

const visiblePages =
  annotationType === 'poetry'
    ? [{ fileName: 'poetry', content: pages.map((p) => p.content).join('\n\n') }]
    : paginatePages(currentPage);

  const tempLabels: Record<string, string[]> = {};

  if (
    usedLabels[bookId || ''] &&
    settings.labelCategories &&
    Array.isArray(settings.labelCategories)
  ) {
    const categoryNames = settings.labelCategories.map((cat: any) => cat.name);

    Object.entries(usedLabels[bookId || ''] || {}).forEach(
      ([category, labels]) => {
        const matchingCategory = settings.labelCategories.find(
          (c: any) => c.name === category,
        );
        const knownLabels = matchingCategory?.labels || [];

        const missing = labels.filter(
          (label: string) => !knownLabels.includes(label),
        );
        if (missing.length > 0) {
          tempLabels[category] = missing;
        }
      },
    );
  }

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
          <BackButton label='Back to Home' navigateTo='/books' />

          <Box sx={{ marginBottom: '2rem', marginTop: '2rem' }}>
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

          <BookProgressSection completion={bookCompletion} />

          <BookNotesSection
            notes={volumeNotes}
            setNotes={(val) => setVolumeNotes(val)}
            onSave={handleSaveNotes}
            onClear={handleClearNotes}
          />

          {annotationType === 'prose' && (
            <BatchAnnotationSection
              fromPage={fromPage}
              toPage={toPage}
              rangeState={rangeState}
              states={states}
              markAllAsLabel={markAllAsLabel}
              bookCompletion={bookCompletion}
              onRangeChange={handleRangeChange}
              onRangeSubmit={handleRangeSubmit}
              onMarkAllAs={handleMarkAllAs}
              onJumpToUnannotated={handleJumpToUnannotated}
            />
          )}

          {annotationType && (
            <ContentSection
              annotationType={annotationType}
              visiblePages={visiblePages}
              annotations={annotations}
              states={states}
              onAnnotationClick={handleAnnotationClick}
              labelCategories={settings.labelCategories}
              setSelectedCategory={setSelectedCategory}
              bookId={bookId || ''}
              isStateActive={isStateActive}
              openLabelModal={openLabelModal}
              setOpenLabelModal={setOpenLabelModal}
              selectedCategory={selectedCategory}
              newLabel={newLabel}
              onLabelChange={setNewLabel}
              persistLabel={persistLabel}
              onPersistChange={setPersistLabel}
              onAddLabel={handleAddLabel}
              temporaryLabels={tempLabels}
            />
          )}

          {annotationType === 'prose' && (
            <PaginationSection
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onGoToPage={handleGoToPage}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default BookDetails;
