import React from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { FaFolderOpen, FaFileCsv } from 'react-icons/fa6';
import { CloseOutlined } from '@mui/icons-material';

import {
  handleBrowseDirectory,
  handleBrowseFile,
} from '../../utils/settings/fileHelpers';

interface GeneralSettingsSectionProps {
  collectionsDir: string;
  setCollectionsDir: (value: string) => void;
  annotationsCsv: string;
  setAnnotationsCsv: (value: string) => void;
  notesCsv: string;
  setNotesCsv: (value: string) => void;
  itemsPerPage: string;
  setItemsPerPage: (value: string) => void;
  volumesPerPage: string;
  setVolumesPerPage: (value: string) => void;
  annotationType: 'poetry' | 'prose';
}

const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({
  collectionsDir,
  setCollectionsDir,
  annotationsCsv,
  setAnnotationsCsv,
  notesCsv,
  setNotesCsv,
  itemsPerPage,
  setItemsPerPage,
  volumesPerPage,
  setVolumesPerPage,
  annotationType,
}) => {
  return (
    <>
      {/* 1. Select Collections Directory */}
      <Box mt={5} mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            1. Select Collections Directory
          </Typography>
          <Tooltip title="Choose a folder from your local system">
            <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {collectionsDir ? (
            <>
              <Tooltip title={collectionsDir}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FaFolderOpen
                    size={32}
                    style={{ color: '#D29F24', cursor: 'pointer' }}
                  />
                </Box>
              </Tooltip>
              <IconButton
                onClick={() => setCollectionsDir('')}
                size="small"
                color="error"
                sx={{ padding: 0 }}
              >
                <CloseOutlined fontSize="small" />
              </IconButton>
            </>
          ) : (
            <Button
              onClick={() => handleBrowseDirectory(setCollectionsDir)}
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

      {/* 2. Select Annotations File */}
      <Box mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            2. Select Annotations File
          </Typography>
          <Tooltip title="Choose a file (supported types: .csv, .xlsx)">
            <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {annotationsCsv ? (
            <>
              <Tooltip title={annotationsCsv}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FaFileCsv
                    size={30}
                    style={{ color: 'green', cursor: 'pointer' }}
                  />
                </Box>
              </Tooltip>
              <IconButton
                onClick={() => setAnnotationsCsv('')}
                size="small"
                color="error"
                sx={{ padding: 0 }}
              >
                <CloseOutlined fontSize="small" />
              </IconButton>
            </>
          ) : (
            <Button
              onClick={() => handleBrowseFile(setAnnotationsCsv)}
              variant="contained"
              sx={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-color)',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'var(--primary-hover)' },
              }}
            >
              Browse
            </Button>
          )}
        </Box>
        <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />
      </Box>

      {/* 3. Select Notes File */}
      <Box mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            3. Select Notes File
          </Typography>
          <Tooltip title="Choose a file (supported types: .csv, .xlsx)">
            <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {notesCsv ? (
            <>
              <Tooltip title={notesCsv}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FaFileCsv
                    size={30}
                    style={{ color: 'green', cursor: 'pointer' }}
                  />
                </Box>
              </Tooltip>
              <IconButton
                onClick={() => setNotesCsv('')}
                size="small"
                color="error"
                sx={{ padding: 0 }}
              >
                <CloseOutlined fontSize="small" />
              </IconButton>
            </>
          ) : (
            <Button
              onClick={() => handleBrowseFile(setNotesCsv)}
              variant="contained"
              sx={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-color)',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'var(--primary-hover)' },
              }}
            >
              Browse
            </Button>
          )}
        </Box>
        <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />
      </Box>

      {/* 4. Number of Volumes per Page */}
      <Box mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            4. {annotationType === 'poetry' ? 'Poetry Volumes' : 'Books'} per
            Page
          </Typography>
          <Tooltip title="Specify how many items to show per page. Default: 10. Must be greater than 0.">
            <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
          </Tooltip>
        </Box>
        <TextField
          size="small"
          value={volumesPerPage}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            setVolumesPerPage(
              !isNaN(value) && value > 0 ? value.toString() : '',
            );
          }}
          type="number"
          fullWidth
          margin="normal"
        />
        <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />
      </Box>

      {/* 5. Number of Items per Page */}
      <Box mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            5. {annotationType === 'poetry' ? 'Poems' : 'Pages'} per Application
            Page
          </Typography>
          <Tooltip title="Specify how many items should appear at a time. Must be greater than 0.">
            <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
          </Tooltip>
        </Box>
        <TextField
          size="small"
          value={itemsPerPage}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            setItemsPerPage(!isNaN(value) && value > 0 ? value.toString() : '');
          }}
          type="number"
          fullWidth
          margin="normal"
        />
        <Divider sx={{ width: '100%', mx: 'auto', my: 2 }} />
      </Box>
    </>
  );
};

export default GeneralSettingsSection;
