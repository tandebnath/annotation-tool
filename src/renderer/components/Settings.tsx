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
  Dialog,
  CircularProgress,
  DialogTitle,
  DialogContent,
  Divider,
  IconButton,
  Checkbox,
} from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
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
  const [isExtracting, setIsExtracting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('settings:load')
      .then(async (settings) => {
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

          if (
            settings.isMetadataAvailable &&
            settings.metadataFilePath &&
            !csvColumns.length
          ) {
            try {
              console.log('Loading metadata columns from saved file...');
              const columns = await window.electron.ipcRenderer.invoke(
                'getCsvColumns',
                settings.metadataFilePath,
              );
              setCsvColumns(columns);
            } catch (error) {
              console.error('Error loading metadata columns:', error);
            }
          }
        }
      });
  }, []);

  const handleSaveSettings = () => {
    // Check if any metadata field is empty
    if (metadataFields.some((field) => !field.column || !field.label)) {
      alert('Please fill in all metadata fields before saving.');
      return;
    }

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
    // Check if there's an empty metadata field before adding a new one
    if (metadataFields.some((field) => !field.column || !field.label)) {
      alert('Please fill in all metadata fields before adding another.');
      return;
    }

    setMetadataFields([
      ...metadataFields,
      { column: '', label: '', displayOnCover: false },
    ]);
  };

  const handleRemoveMetadataField = (index: number) => {
    const updatedFields = [...metadataFields];
    updatedFields.splice(index, 1);
    setMetadataFields(updatedFields);
  };

  const handleMetadataFieldChange = (
    index: number,
    field: keyof (typeof metadataFields)[0],
    value: any,
  ) => {
    const updatedFields: any = [...metadataFields];

    // Check if trying to set displayOnCover to true and ensure only 2 are allowed
    if (field === 'displayOnCover' && value) {
      const displayOnCoverCount = updatedFields.filter(
        (field: any) => field.displayOnCover,
      ).length;

      if (displayOnCoverCount >= 2) {
        alert('You can only display up to 2 fields on the cover.');
        return;
      }
    }

    updatedFields[index][field] = value;
    setMetadataFields(updatedFields);
  };

  return (
    <Container
      sx={{ padding: '2rem 5rem', fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* <Typography
        variant="h4"
        gutterBottom
        sx={{
          textAlign: 'center',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        Settings
      </Typography> */}
      <Divider sx={{ marginBottom: '2rem' }} />
      <Box
        mb={4}
        sx={{ display: 'flex', flexDirection: 'column', rowGap: '1rem' }}
      >
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Select Books Directory
          </Typography>
          <TextField
            size="small"
            value={booksDir}
            onChange={(e) => setBooksDir(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            sx={{ marginTop: '0.25rem' }}
            InputProps={{
              endAdornment: (
                <Button
                  onClick={handleBrowseDirectory}
                  variant="contained"
                  color="info"
                  sx={{
                    fontWeight: 600,
                    minWidth: 0,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 0,
                    backgroundColor: '#13294B',
                  }}
                >
                  Browse
                </Button>
              ),
              readOnly: true,
              sx: {
                paddingRight: 0, // Remove padding inside the TextField on the right
              },
            }}
          />
        </Box>
        <Box>
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
                  onClick={() => handleBrowseFile(setAnnotationsCsv)}
                  variant="contained"
                  color="info"
                  sx={{
                    fontWeight: 600,
                    minWidth: 0,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 0,
                    backgroundColor: '#13294B',
                  }}
                >
                  Browse
                </Button>
              ),
              readOnly: true,
              sx: {
                paddingRight: 0,
              },
            }}
            sx={{ marginTop: '0.25rem' }}
          />
        </Box>
        <Box>
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
                  onClick={() => handleBrowseFile(setVolumeNotesCsv)}
                  variant="contained"
                  color="info"
                  sx={{
                    fontWeight: 600,
                    minWidth: 0,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 0,
                    backgroundColor: '#13294B',
                  }}
                >
                  Browse
                </Button>
              ),
              readOnly: true,
              sx: {
                paddingRight: 0,
              },
            }}
            sx={{ marginTop: '0.25rem' }}
          />
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Enter Number of Books to Display per Page
          </Typography>
          <TextField
            size="small"
            value={booksPerPage}
            onChange={(e) => setBooksPerPage(e.target.value)}
            type="number"
            fullWidth
            margin="normal"
            sx={{ marginTop: '0.25rem' }}
          />
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Enter Number of Book Pages to Display per Application Page
          </Typography>
          <TextField
            label=""
            size="small"
            value={pagesPerAppPage}
            onChange={(e) => setPagesPerAppPage(e.target.value)}
            type="number"
            fullWidth
            margin="normal"
            sx={{ marginTop: '0.25rem' }}
          />
        </Box>
      </Box>

      <Box mb={4}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Labels
        </Typography>
        <Box mb={2} sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {labels.map((label, index) => (
            <Chip
              key={index}
              label={label}
              color="secondary"
              onDelete={() => handleDeleteLabel(label)}
              sx={{ marginRight: 1, marginBottom: 1 }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', height: '100%', flexDirection: 'row' }}>
          <TextField
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            fullWidth
            size="small"
            placeholder="Enter label"
          />
          <Button
            onClick={handleAddLabel}
            variant="contained"
            color="success"
            size="small"
            sx={{ marginLeft: 2, textWrap: 'nowrap', fontWeight: 'bold' }}
          >
            Save Label
          </Button>
        </Box>
      </Box>

      {labels.length > 0 && (
        <Box mb={4}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Choose Default Label for 'Mark as' Button
          </Typography>
          <TextField
            select
            size="small"
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
        sx={{
          '& .MuiFormControlLabel-label': {
            fontSize: '1.125rem',
            fontWeight: 'bold',
          },
          marginTop: '1rem',
        }}
      />

      {isMetadataAvailable && (
        <Box mb={1} sx={{ marginTop: '1.5rem' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Upload Metadata File
          </Typography>
          <TextField
            value={metadataFilePath}
            fullWidth
            size="small"
            margin="normal"
            InputProps={{
              endAdornment: (
                <Button
                  onClick={handleUploadMetadataFile}
                  variant="contained"
                  color="info"
                  sx={{
                    fontWeight: 600,
                    minWidth: 0,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 0,
                    backgroundColor: '#13294B',
                  }}
                >
                  Upload
                </Button>
              ),
              readOnly: true,
              sx: {
                paddingRight: 0, // Remove padding inside the TextField on the right
              },
            }}
            sx={{ marginTop: '0.25rem' }}
          />
        </Box>
      )}

      {csvColumns.length > 0 && (
        <>
          <Box mb={4}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Choose Book ID Column
            </Typography>
            <TextField
              select
              size="small"
              value={bookIdColumn}
              onChange={(e) => setBookIdColumn(e.target.value)}
              fullWidth
              sx={{ marginTop: '0.25rem' }}
            >
              {csvColumns.map((column, idx) => (
                <MenuItem key={idx} value={column}>
                  {column}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 'bold', marginBottom: '1rem' }}
            >
              Add or Remove Metadata Fields
            </Typography>
            {metadataFields.map((field, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'row',
                  columnGap: '0.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <IconButton
                  color="error"
                  onClick={() => handleRemoveMetadataField(index)}
                  sx={{ marginLeft: 2 }}
                >
                  <CloseOutlined />
                </IconButton>
                <TextField
                  select
                  size="small"
                  label="Select Column from Metadata File"
                  fullWidth
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
                  label="Enter Label to Assign"
                  size="small"
                  fullWidth
                  value={field.label}
                  onChange={(e) =>
                    handleMetadataFieldChange(index, 'label', e.target.value)
                  }
                  sx={{ marginRight: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.displayOnCover}
                      onChange={(e: any) =>
                        handleMetadataFieldChange(
                          index,
                          'displayOnCover',
                          e.target.checked,
                        )
                      }
                      color="primary"
                    />
                  }
                  label="Show on Book Cover"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      textWrap: 'nowrap',
                    },
                  }}
                />
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddMetadataField}
              sx={{ fontWeight: 'bold', mb: 8 }}
            >
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
        sx={{ fontWeight: 'bold' }}
      >
        Save
      </Button>
    </Container>
  );
};

export default Settings;
