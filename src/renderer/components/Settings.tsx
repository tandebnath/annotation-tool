import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Chip,
  Typography,
  MenuItem,
  Switch,
  FormControlLabel,
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
  const [isMetadataAvailable, setIsMetadataAvailable] = useState(false);
  const [metadataFilePath, setMetadataFilePath] = useState('');
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [bookIdColumn, setBookIdColumn] = useState('');
  const [metadataFields, setMetadataFields] = useState<
    { column: string; label: string; displayOnCover: boolean }[]
  >([]);

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
        setIsMetadataAvailable(settings.isMetadataAvailable || false);
        setMetadataFilePath(settings.metadataFilePath || '');
        setBookIdColumn(settings.bookIdColumn || '');
        setMetadataFields(settings.metadataFields || []);
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
        isMetadataAvailable,
        metadataFilePath,
        bookIdColumn,
        metadataFields,
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

  const handleUploadMetadataFile = () => {
    console.log('Initiating metadata file upload...');

    window.electron.ipcRenderer
      .invoke('dialog:openFile')
      .then(async (filePath) => {
        if (filePath) {
          console.log(`File selected: ${filePath}`);
          setMetadataFilePath(filePath);
          try {
            console.log(
              'Attempting to extract columns from the metadata file...',
            );
            const columns = await window.electron.ipcRenderer.invoke(
              'getCsvColumns',
              filePath,
            );
            console.log('Columns extracted successfully:', columns);
            setCsvColumns(columns);
          } catch (error) {
            console.error('Error extracting columns:', error);
            const proceedWithoutMetadata = window.confirm(
              'Column names could not be extracted from the metadata file. Would you like to proceed without metadata?',
            );
            if (proceedWithoutMetadata) {
              console.log('User chose to proceed without metadata.');
              setIsMetadataAvailable(false);
              setMetadataFilePath('');
            } else {
              console.log(
                'User chose to try uploading the metadata file again.',
              );
            }
          }
        } else {
          console.log('No file was selected.');
        }
      })
      .catch((error) => {
        console.error('Error during file selection:', error);
      });
  };

  const handleAddMetadataField = () => {
    setMetadataFields([
      ...metadataFields,
      { column: '', label: '', displayOnCover: false },
    ]);
  };

  const handleMetadataFieldChange = (
    index: number,
    field: keyof (typeof metadataFields)[0],
    value: any,
  ) => {
    const updatedFields: any = [...metadataFields];
    updatedFields[index][field] = value;
    setMetadataFields(updatedFields);
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

      <FormControlLabel
        control={
          <Switch
            checked={isMetadataAvailable}
            onChange={(e) => setIsMetadataAvailable(e.target.checked)}
            color="primary"
          />
        }
        label="Is Metadata Available?"
      />

      {isMetadataAvailable && (
        <Box mb={4}>
          <TextField
            label="Upload Metadata File"
            value={metadataFilePath}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <Button onClick={handleUploadMetadataFile}>Upload</Button>
              ),
              readOnly: true,
            }}
          />
        </Box>
      )}

      {csvColumns.length > 0 && (
        <>
          <Box mb={4}>
            <TextField
              select
              label="Choose Book ID Column"
              value={bookIdColumn}
              onChange={(e) => setBookIdColumn(e.target.value)}
              fullWidth
            >
              {csvColumns.map((column, idx) => (
                <MenuItem key={idx} value={column}>
                  {column}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography variant="h6">Metadata Fields</Typography>
            {metadataFields.map((field, index) => (
              <Box
                key={index}
                sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
              >
                <TextField
                  select
                  label="Choose Metadata Column"
                  value={field.column}
                  onChange={(e) =>
                    handleMetadataFieldChange(index, 'column', e.target.value)
                  }
                  sx={{ marginRight: 2 }}
                >
                  {csvColumns.map((column, idx) => (
                    <MenuItem key={idx} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Label"
                  value={field.label}
                  onChange={(e) =>
                    handleMetadataFieldChange(index, 'label', e.target.value)
                  }
                  sx={{ marginRight: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.displayOnCover}
                      onChange={(e) =>
                        handleMetadataFieldChange(
                          index,
                          'displayOnCover',
                          e.target.checked,
                        )
                      }
                      color="primary"
                    />
                  }
                  label="Display on Cover"
                />
              </Box>
            ))}
            <Button onClick={handleAddMetadataField}>
              + Add Metadata Field
            </Button>
          </Box>
        </>
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
