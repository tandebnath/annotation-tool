import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Divider,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { CloseOutlined, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PoetrySettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [collectionsDir, setCollectionsDir] = useState('');
  const [annotationsCsv, setAnnotationsCsv] = useState('');
  const [poemsPerPage, setPoemsPerPage] = useState('');
  const [labelCategories, setLabelCategories] = useState<
    { name: string; labels: string[] }[]
  >([]);
  const [volumeNotesCsv, setVolumeNotesCsv] = useState('');
  const [allowMultipleLabels, setAllowMultipleLabels] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('settings:load', 'poetry')
      .then((settings) => {
        if (settings) {
          setCollectionsDir(settings.collectionsDir || '');
          setAnnotationsCsv(settings.annotationsCsv || '');
          setPoemsPerPage(settings.poemsPerPage || '');
          setLabelCategories(settings.labelCategories || []);
        }
      });
  }, []);

  const handleSaveSettings = () => {
    if (!collectionsDir || !annotationsCsv || !poemsPerPage) {
      alert('Please fill in all fields before saving.');
      return;
    }

    const settings = {
      collectionsDir,
      annotationsCsv,
      poemsPerPage,
      labelCategories,
      volumeNotesCsv, // Added volume notes file
      allowMultipleLabels, // Store the checkbox value
    };

    console.log('SAVING POETRY SETTINGS:', settings);

    window.electron.ipcRenderer
      .invoke('settings:save', { type: 'poetry', settings })
      .then(() => {
        alert('Settings saved successfully!');
        navigate('/');
      });
  };

  const handleBrowseDirectory = () => {
    window.electron.ipcRenderer.invoke('dialog:openDirectory').then((dir) => {
      if (dir) setCollectionsDir(dir);
    });
  };

  const handleBrowseFile = () => {
    window.electron.ipcRenderer.invoke('dialog:openFile').then((filePath) => {
      if (filePath) {
        setAnnotationsCsv(filePath);
      }
    });
  };

  const handleBrowseVolumeNotes = () => {
    window.electron.ipcRenderer.invoke('dialog:openFile').then((filePath) => {
      if (filePath) setVolumeNotesCsv(filePath);
    });
  };

  const handleAddCategory = () => {
    if (
      newCategory.trim() &&
      !labelCategories.some((c) => c.name === newCategory)
    ) {
      setLabelCategories([
        ...labelCategories,
        { name: newCategory, labels: [] },
      ]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    setLabelCategories(
      labelCategories.filter((cat) => cat.name !== categoryName),
    );
    if (selectedCategory === categoryName) {
      setSelectedCategory('');
    }
  };

  const handleAddLabel = () => {
    if (!selectedCategory || !newLabel.trim()) return;

    setLabelCategories(
      labelCategories.map((cat) =>
        cat.name === selectedCategory
          ? { ...cat, labels: [...cat.labels, newLabel] }
          : cat,
      ),
    );
    setNewLabel('');
  };

  const handleDeleteLabel = (categoryName: string, label: string) => {
    setLabelCategories(
      labelCategories.map((cat) =>
        cat.name === categoryName
          ? { ...cat, labels: cat.labels.filter((l) => l !== label) }
          : cat,
      ),
    );
  };

  return (
    <Container sx={{ padding: '2rem', fontFamily: 'Montserrat, sans-serif' }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ marginBottom: 2, fontWeight: 'bold' }}
      >
        Back
      </Button>
      <Divider sx={{ marginBottom: '2rem' }} />

      {/* Select Collections Directory */}
      <Box mb={3}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Select Collections Directory
        </Typography>
        <TextField
          size="small"
          value={collectionsDir}
          onChange={(e) => setCollectionsDir(e.target.value)}
          fullWidth
          variant="outlined"
          margin="normal"
          InputProps={{
            endAdornment: (
              <Button
                onClick={handleBrowseDirectory}
                variant="contained"
                color="info"
              >
                Browse
              </Button>
            ),
            readOnly: true,
          }}
        />
      </Box>

      {/* Select Annotations File */}
      <Box mb={3}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Select Annotations File
        </Typography>
        <TextField
          size="small"
          value={annotationsCsv}
          onChange={(e) => setAnnotationsCsv(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <Button
                onClick={handleBrowseFile}
                variant="contained"
                color="info"
              >
                Browse
              </Button>
            ),
            readOnly: true,
          }}
        />
      </Box>

      <Box mb={3}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Select Volume Notes File
        </Typography>
        <TextField
          size="small"
          value={volumeNotesCsv}
          onChange={(e) => setVolumeNotesCsv(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <Button
                onClick={handleBrowseVolumeNotes}
                variant="contained"
                color="info"
              >
                Browse
              </Button>
            ),
            readOnly: true,
          }}
        />
      </Box>

      {/* Enter Number of Poems per Page */}
      <Box mb={3}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Enter Number of Poems to Display per Page
        </Typography>
        <TextField
          size="small"
          value={poemsPerPage}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value > 0) {
              setPoemsPerPage(value.toString());
            } else {
              setPoemsPerPage('');
            }
          }}
          type="number"
          fullWidth
          margin="normal"
        />
      </Box>

      <Divider sx={{ marginBottom: '2rem' }} />

      {/* Label Categories */}
      <Box mb={4}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
          Label Categories
        </Typography>

        {/* Create New Category */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            marginBottom: 3,
          }}
        >
          <TextField
            label="New Category"
            size="small"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            fullWidth
          />
          <Button
            onClick={handleAddCategory}
            variant="contained"
            color="success"
          >
            Add Category
          </Button>
        </Box>

        {/* Categories List - Styled */}
        {labelCategories.map((category) => (
          <Box
            key={category.name}
            sx={{
              backgroundColor: '#F5F5F5',
              padding: '1rem',
              borderRadius: '8px',
              boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
              marginBottom: 2,
            }}
          >
            {/* Category Name + Delete */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 1,
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 'bold', color: '#333' }}
              >
                {category.name}
              </Typography>
              <IconButton
                color="error"
                onClick={() => handleDeleteCategory(category.name)}
              >
                <CloseOutlined />
              </IconButton>
            </Box>

            {/* Labels within the Category */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                marginBottom: 2,
              }}
            >
              {category.labels.map((label, index) => (
                <Chip
                  key={index}
                  label={label}
                  onDelete={() => handleDeleteLabel(category.name, label)}
                  color="primary"
                  sx={{ backgroundColor: '#1976D2', color: 'white' }}
                />
              ))}
            </Box>

            {/* Add Label Section */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="New Label"
                size="small"
                value={selectedCategory === category.name ? newLabel : ''}
                onChange={(e) => {
                  setSelectedCategory(category.name); // Ensure correct category is selected
                  setNewLabel(e.target.value); // Update input value
                }}
                fullWidth
              />
              <Button
                onClick={() => {
                  handleAddLabel();
                }}
                variant="contained"
                color="primary"
                disabled={!newLabel.trim()} // Disable button if empty input
              >
                Add Label
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Checkbox to Allow Multiple Label Selection */}
      <Box mb={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowMultipleLabels}
              onChange={(e) => setAllowMultipleLabels(e.target.checked)}
            />
          }
          label="Allow selection of multiple labels in a category?"
        />
      </Box>

      <Button
        variant="contained"
        color="success"
        onClick={handleSaveSettings}
        fullWidth
      >
        Save
      </Button>
    </Container>
  );
};

export default PoetrySettings;
