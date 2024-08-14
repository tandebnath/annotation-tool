import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Chip,
  Typography,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const [booksDir, setBooksDir] = useState('');
  const [annotationsCsv, setAnnotationsCsv] = useState('');
  const [volumeNotesCsv, setVolumeNotesCsv] = useState('');
  const [booksPerPage, setBooksPerPage] = useState('');
  const [pagesPerAppPage, setPagesPerAppPage] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [defaultLabel, setDefaultLabel] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer.invoke('settings:load').then((settings) => {
      if (settings) {
        setBooksDir(settings.booksDir || '');
        setAnnotationsCsv(settings.annotationsCsv || '');
        setVolumeNotesCsv(settings.volumeNotesCsv || '');
        setBooksPerPage(settings.booksPerPage || '');
        setPagesPerAppPage(settings.pagesPerAppPage || '');
        setLabels(settings.labels || []);
        setDefaultLabel(settings.defaultLabel || '');
      }
    });
  }, []);

  const handleSaveSettings = () => {
    if (checkFields()) {
      const settings = {
        booksDir,
        annotationsCsv,
        volumeNotesCsv,
        booksPerPage,
        pagesPerAppPage,
        labels,
        defaultLabel,
      };

      window.electron.ipcRenderer.invoke('settings:save', settings).then(() => {
        alert('Settings saved successfully!');
        navigate('/'); // Redirect to the book list page
      });
    } else {
      alert('Please fill all fields!');
    }
  };

  const checkFields = () => {
    return (
      booksDir &&
      annotationsCsv &&
      volumeNotesCsv &&
      booksPerPage &&
      pagesPerAppPage &&
      labels.length > 0 &&
      defaultLabel
    );
  };

  const handleAddLabel = () => {
    if (labelInput && !labels.includes(labelInput)) {
      setLabels([...labels, labelInput]);
      setLabelInput('');
    }
  };

  const handleDeleteLabel = (labelToDelete: string) => {
    const updatedLabels = labels.filter((label) => label !== labelToDelete);
    setLabels(updatedLabels);
    if (updatedLabels.length === 0) {
      setDefaultLabel('');
    }
  };

  const handleBrowseDirectory = () => {
    window.electron.ipcRenderer
      .invoke('dialog:openDirectory')
      .then((directoryPath) => {
        if (directoryPath) {
          setBooksDir(directoryPath);
        }
      });
  };

  const handleBrowseFile = (
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    window.electron.ipcRenderer.invoke('dialog:openFile').then((filePath) => {
      if (filePath) {
        setter(filePath);
      }
    });
  };

  return (
    <Container
      sx={{ padding: '2rem 5rem', fontFamily: 'Montserrat, sans-serif' }}
    >
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Box mb={4}>
        <TextField
          label="Path to Books Directory"
          value={booksDir}
          onChange={(e) => setBooksDir(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <Button onClick={handleBrowseDirectory}>Browse</Button>
            ),
            readOnly: true,
          }}
        />
        <TextField
          label="Path to Annotations CSV"
          value={annotationsCsv}
          onChange={(e) => setAnnotationsCsv(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <Button onClick={() => handleBrowseFile(setAnnotationsCsv)}>
                Browse
              </Button>
            ),
            readOnly: true,
          }}
        />
        <TextField
          label="Path to Volume Notes CSV"
          value={volumeNotesCsv}
          onChange={(e) => setVolumeNotesCsv(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <Button onClick={() => handleBrowseFile(setVolumeNotesCsv)}>
                Browse
              </Button>
            ),
            readOnly: true,
          }}
        />
        <TextField
          label="Number of Books to Display per Page"
          value={booksPerPage}
          onChange={(e) => setBooksPerPage(e.target.value)}
          type="number"
          fullWidth
          margin="normal"
        />
        <TextField
          label="Number of Book Pages to Display per (Application) Page"
          value={pagesPerAppPage}
          onChange={(e) => setPagesPerAppPage(e.target.value)}
          type="number"
          fullWidth
          margin="normal"
        />
      </Box>

      <Box mb={4}>
        <Typography variant="h6">Labels</Typography>
        <Box mb={2} sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {labels.map((label, index) => (
            <Chip
              key={index}
              label={label}
              onDelete={() => handleDeleteLabel(label)}
              sx={{ marginRight: 1, marginBottom: 1 }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex' }}>
          <TextField
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            fullWidth
            placeholder="Enter label"
          />
          <Button onClick={handleAddLabel} sx={{ marginLeft: 2 }}>
            Save Label
          </Button>
        </Box>
      </Box>

      {labels.length > 0 && (
        <Box mb={4}>
          <TextField
            select
            label="Default Label for 'Mark as' Button"
            value={defaultLabel}
            onChange={(e) => setDefaultLabel(e.target.value)}
            fullWidth
          >
            {labels.map((label, index) => (
              <MenuItem key={index} value={label}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )}

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

export default Settings;
