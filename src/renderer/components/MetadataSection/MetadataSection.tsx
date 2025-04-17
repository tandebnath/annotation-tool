import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Checkbox,
  Divider,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { CloseOutlined } from '@mui/icons-material';
import { FaFileCsv } from 'react-icons/fa6';

import {
  handleUploadMetadataFile,
  handleAddMetadataField,
  handleRemoveMetadataField,
  handleMetadataFieldChange,
} from '../../utils/settings/metadataHelpers';

interface MetadataSectionProps {
  isMetadataAvailable: boolean;
  setIsMetadataAvailable: (val: boolean) => void;
  metadataFilePath: string;
  setMetadataFilePath: (val: string) => void;
  csvColumns: string[];
  setCsvColumns: (cols: string[]) => void;
  volumeIdColumn: string;
  setVolumeIdColumn: (val: string) => void;
  metadataFields: {
    column: string;
    label: string;
    displayOnCover: boolean;
  }[];
  setMetadataFields: (fields: any[]) => void;
}

const MetadataSection: React.FC<MetadataSectionProps> = ({
  isMetadataAvailable,
  setIsMetadataAvailable,
  metadataFilePath,
  setMetadataFilePath,
  csvColumns,
  setCsvColumns,
  volumeIdColumn,
  setVolumeIdColumn,
  metadataFields,
  setMetadataFields,
}) => {
  return (
    <Box mb={4}>
      {/* 7. Metadata Settings Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          7. Metadata Settings
        </Typography>
        <Tooltip title="Optional: Upload metadata file to display info like author, genre, etc. on book covers.">
          <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
        </Tooltip>
      </Box>

      {/* Toggle Metadata Availability */}
      <FormControlLabel
        control={
          <Switch
            checked={isMetadataAvailable}
            onChange={(e) => {
              const newVal = e.target.checked;
              setIsMetadataAvailable(newVal);
              if (!newVal) {
                // Clear metadata state
                setMetadataFilePath('');
                setCsvColumns([]);
                setVolumeIdColumn('');
                setMetadataFields([]);
              }
            }}
            color="primary"
          />
        }
        label="Is Metadata Available?"
        sx={{
          '& .MuiFormControlLabel-label': {
            fontSize: '1rem',
            fontWeight: 'bold',
          },
          mb: 2,
          ml: 2,
        }}
      />

      <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />

      {isMetadataAvailable && (
        <>
          {/* 7a. Upload Metadata File */}
          <Box mb={3} sx={{ ml: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                7a. Upload Metadata File
              </Typography>
              <Tooltip title="Choose a file (supported: .csv)">
                <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {metadataFilePath ? (
                <>
                  <Tooltip title={metadataFilePath}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FaFileCsv
                        size={30}
                        style={{ color: 'green', cursor: 'pointer' }}
                      />
                    </Box>
                  </Tooltip>
                  <IconButton
                    onClick={() => {
                      setMetadataFilePath('');
                      setCsvColumns([]);
                    }}
                    size="small"
                    color="error"
                    sx={{ padding: 0 }}
                  >
                    <CloseOutlined fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Button
                  onClick={() =>
                    handleUploadMetadataFile(
                      setMetadataFilePath,
                      setCsvColumns,
                      setIsMetadataAvailable,
                    )
                  }
                  variant="contained"
                  sx={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--text-color)',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'var(--primary-hover)' },
                  }}
                >
                  Browse
                </Button>
              )}
            </Box>

            <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />
          </Box>

          {/* 7b. Choose Volume ID Column */}
          {csvColumns.length > 0 && (
            <Box mb={3} sx={{ ml: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  7b. Choose Volume ID Column
                </Typography>
                <Tooltip title="This column uniquely identifies each volume">
                  <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
                </Tooltip>
              </Box>
              <TextField
                select
                size="small"
                value={volumeIdColumn}
                onChange={(e) => setVolumeIdColumn(e.target.value)}
                fullWidth
                sx={{ marginTop: '0.5rem' }}
              >
                {csvColumns.map((column, idx) => (
                  <MenuItem key={idx} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </TextField>
              <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />
            </Box>
          )}

          {/* 7c. Add or Remove Metadata Fields */}
          {csvColumns.length > 0 && (
            <Box sx={{ ml: 2 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  7c. Add or Remove Metadata Fields
                </Typography>
                <Tooltip title="Add labels to display on book covers">
                  <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
                </Tooltip>
              </Box>

              {metadataFields.map((field, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <IconButton
                    color="error"
                    onClick={() =>
                      handleRemoveMetadataField(
                        index,
                        metadataFields,
                        setMetadataFields,
                      )
                    }
                    sx={{ minWidth: '32px' }}
                  >
                    <CloseOutlined />
                  </IconButton>

                  <TextField
                    select
                    label="Select Column"
                    size="small"
                    value={field.column}
                    onChange={(e) =>
                      handleMetadataFieldChange(
                        index,
                        'column',
                        e.target.value,
                        metadataFields,
                        setMetadataFields,
                      )
                    }
                    sx={{ minWidth: 180, flex: 1 }}
                  >
                    {csvColumns.map((column, idx) => (
                      <MenuItem key={idx} value={column}>
                        {column}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Label Name"
                    size="small"
                    value={field.label}
                    onChange={(e) =>
                      handleMetadataFieldChange(
                        index,
                        'label',
                        e.target.value,
                        metadataFields,
                        setMetadataFields,
                      )
                    }
                    sx={{ minWidth: 180, flex: 1 }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.displayOnCover}
                        onChange={(e) =>
                          handleMetadataFieldChange(
                            index,
                            'displayOnCover',
                            e.target.checked,
                            metadataFields,
                            setMetadataFields,
                          )
                        }
                        color="primary"
                      />
                    }
                    label="Show on Cover"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </Box>
              ))}

              <Button
                variant="outlined"
                onClick={() =>
                  handleAddMetadataField(metadataFields, setMetadataFields)
                }
                sx={{
                  fontWeight: 'bold',
                  color: 'black',
                  borderColor: 'var(--primary-color)',
                  textTransform: 'none',
                  mb: 2,
                  '&:hover': {
                    borderColor: 'var(--primary-hover)',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                  },
                }}
              >
                + Add Metadata Field
              </Button>

              <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default MetadataSection;
