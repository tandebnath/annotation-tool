import React, { useState, useEffect } from 'react';
import { Container, Button, Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../BackButton/BackButton';

import GeneralSettingsSection from '../GeneralSettingsSection/GeneralSettingsSection';
import LabelCategorySection from '../LabelCategorySection/LabelCategorySection';
import MetadataSection from '../MetadataSection/MetadataSection';

import { useSession } from '../../context/SessionContext';

const AnnotationSettings: React.FC = () => {
  const [collectionsDir, setCollectionsDir] = useState('');
  const [annotationsCsv, setAnnotationsCsv] = useState('');
  const [notesCsv, setNotesCsv] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState('5');
  const [volumesPerPage, setVolumesPerPage] = useState('10');

  const [labelCategories, setLabelCategories] = useState<
    { name: string; labels: string[] }[]
  >([]);
  const [allowMultipleLabels, setAllowMultipleLabels] = useState(true);
  const [markAllAsLabel, setMarkAllAsLabel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);

  const [isMetadataAvailable, setIsMetadataAvailable] = useState(false);
  const [metadataFilePath, setMetadataFilePath] = useState('');
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [volumeIdColumn, setVolumeIdColumn] = useState('');
  const [metadataFields, setMetadataFields] = useState<
    { column: string; label: string; displayOnCover: boolean }[]
  >([]);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { annotationType, setAnnotationType } = useSession();

  const handleBack = () => {
    const from = location.state?.from;
    if (from === 'session-selection') {
      navigate('/settings');
    } else {
      navigate('/settings/select-type');
    }
  };

  useEffect(() => {
    if (!annotationType) {
      navigate('/settings');
      return;
    }

    window.electron.ipcRenderer
      .invoke('settings:load', annotationType)
      .then((settings) => {
        if (settings) {
          setCollectionsDir(settings.collectionsDir || '');
          setAnnotationsCsv(settings.annotationsCsv || '');
          setNotesCsv(settings.notesCsv || '');
          setItemsPerPage(settings.itemsPerPage || '5');
          setVolumesPerPage(settings.volumesPerPage || '10');
          setLabelCategories(settings.labelCategories || []);
          setAllowMultipleLabels(settings.allowMultipleLabels ?? true);
          setIsMetadataAvailable(settings.isMetadataAvailable ?? false);
          setMetadataFilePath(settings.metadataFilePath || '');
          setCsvColumns(settings.csvColumns || []);
          setVolumeIdColumn(settings.volumeIdColumn || '');
          setMetadataFields(settings.metadataFields || []);
          setMarkAllAsLabel(settings.markAllAsLabel || '');
        }
      });
  }, [annotationType, navigate]);

  const handleSaveSettings = async () => {
    const errors: string[] = [];
    if (!collectionsDir) errors.push('Please select a Collections Directory.');
    if (!annotationsCsv) errors.push('Please select an Annotations File.');
    if (!notesCsv) errors.push('Please select a Notes File.');
    if (
      !labelCategories.length ||
      !labelCategories.some((cat) => cat.labels.length > 0)
    ) {
      errors.push('Please add at least one label in one category.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);

    const settings = {
      collectionsDir,
      annotationsCsv,
      itemsPerPage,
      volumesPerPage,
      labelCategories,
      notesCsv,
      allowMultipleLabels,
      // Include metadata-specific state
      isMetadataAvailable,
      metadataFilePath,
      csvColumns,
      volumeIdColumn,
      metadataFields,
      markAllAsLabel
    };

    await window.electron.ipcRenderer.invoke('settings:save', {
      annotationType,
      settings,
    });

    setAnnotationType(annotationType); // reaffirm context
    alert('Settings saved successfully!');
    navigate('/books');
  };

  if (annotationType !== 'poetry' && annotationType !== 'prose') {
    return null;
  }

  return (
    <Container sx={{ padding: '2rem 0' }}>
      <BackButton onClick={handleBack} />

      <GeneralSettingsSection
        collectionsDir={collectionsDir}
        setCollectionsDir={setCollectionsDir}
        annotationsCsv={annotationsCsv}
        setAnnotationsCsv={setAnnotationsCsv}
        notesCsv={notesCsv}
        setNotesCsv={setNotesCsv}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        volumesPerPage={volumesPerPage}
        setVolumesPerPage={setVolumesPerPage}
        annotationType={annotationType}
      />

      <LabelCategorySection
        labelCategories={labelCategories}
        setLabelCategories={setLabelCategories}
        allowMultipleLabels={allowMultipleLabels}
        setAllowMultipleLabels={setAllowMultipleLabels}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        newLabel={newLabel}
        setNewLabel={setNewLabel}
        isBatchMode={isBatchMode}
        setIsBatchMode={setIsBatchMode}
        markAllAsLabel={markAllAsLabel}
        setMarkAllAsLabel={setMarkAllAsLabel}
        annotationType={annotationType}
      />

      <MetadataSection
        isMetadataAvailable={isMetadataAvailable}
        setIsMetadataAvailable={setIsMetadataAvailable}
        metadataFilePath={metadataFilePath}
        setMetadataFilePath={setMetadataFilePath}
        csvColumns={csvColumns}
        setCsvColumns={setCsvColumns}
        volumeIdColumn={volumeIdColumn}
        setVolumeIdColumn={setVolumeIdColumn}
        metadataFields={metadataFields}
        setMetadataFields={setMetadataFields}
      />

      <Button
        variant="contained"
        onClick={handleSaveSettings}
        fullWidth
        sx={{
          backgroundColor: 'var(--proceed-color)',
          color: 'white',
          fontWeight: 600,
          textTransform: 'uppercase',
          '&:hover': { backgroundColor: 'var(--proceed-hover)' },
          '&:active': { backgroundColor: 'var(--proceed-active)' },
        }}
      >
        Save
      </Button>

      {formErrors.length > 0 && (
        <Box mt={2}>
          {formErrors.map((msg, idx) => (
            <Typography
              key={idx}
              color="error"
              variant="body2"
              sx={{ mb: 0.5 }}
            >
              • {msg}
            </Typography>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default AnnotationSettings;
