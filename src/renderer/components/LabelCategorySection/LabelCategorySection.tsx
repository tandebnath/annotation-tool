import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { CloseOutlined } from '@mui/icons-material';
import {
  handleAddCategory,
  handleDeleteCategory,
  handleAddLabel,
  handleDeleteLabel,
} from '../../utils/settings/labelHelpers';

interface LabelCategorySectionProps {
  labelCategories: { name: string; labels: string[] }[];
  setLabelCategories: (
    categories: { name: string; labels: string[] }[],
  ) => void;
  newCategory: string;
  setNewCategory: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  newLabel: string;
  setNewLabel: (val: string) => void;
  isBatchMode: boolean;
  setIsBatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  allowMultipleLabels: boolean;
  setAllowMultipleLabels: (val: boolean) => void;
  markAllAsLabel: string;
  setMarkAllAsLabel: (val: string) => void;
  annotationType: 'poetry' | 'prose';
}

const LabelCategorySection: React.FC<LabelCategorySectionProps> = ({
  labelCategories,
  setLabelCategories,
  newCategory,
  setNewCategory,
  selectedCategory,
  setSelectedCategory,
  newLabel,
  setNewLabel,
  isBatchMode,
  setIsBatchMode,
  allowMultipleLabels,
  setAllowMultipleLabels,
  markAllAsLabel,
  setMarkAllAsLabel,
  annotationType,
}) => {
  return (
    <Box mb={4}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          5. Label Categories
        </Typography>
        <Tooltip title="Group your labels into categories for better organization.">
          <HelpOutlineIcon sx={{ fontSize: '1.1rem', color: 'gray' }} />
        </Tooltip>
      </Box>

      {/* Add New Category */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <TextField
          label="Enter Category Name"
          size="small"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          fullWidth
        />
        <Button
          onClick={() =>
            handleAddCategory(
              newCategory,
              labelCategories,
              setLabelCategories,
              setNewCategory,
            )
          }
          variant="contained"
          sx={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--text-color)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            '&:hover': { backgroundColor: 'var(--primary-hover)' },
            '&:active': { backgroundColor: 'var(--primary-active)' },
          }}
        >
          Add Category
        </Button>
      </Box>

      {/* Existing Categories */}
      {labelCategories.map((category) => (
        <Box
          key={category.name}
          sx={{
            backgroundColor: '#F5F5F5',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            mb: 2,
          }}
        >
          {/* Header with Delete */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {category.name}
            </Typography>
            <IconButton
              color="error"
              onClick={() =>
                handleDeleteCategory(
                  category.name,
                  labelCategories,
                  setLabelCategories,
                  setSelectedCategory,
                  selectedCategory,
                )
              }
            >
              <CloseOutlined />
            </IconButton>
          </Box>

          {/* Labels */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {category.labels.map((label, index) => (
              <Chip
                key={index}
                label={label}
                onDelete={() =>
                  handleDeleteLabel(
                    category.name,
                    label,
                    labelCategories,
                    setLabelCategories,
                  )
                }
                sx={{
                  backgroundColor: 'var(--secondary-main)',
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>

          {/* Label Input */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
            <TextField
              label={
                isBatchMode
                  ? `Enter Labels' Names (comma or new-line separated)`
                  : 'Enter Label Name'
              }
              size="small"
              value={selectedCategory === category.name ? newLabel : ''}
              onChange={(e) => {
                setSelectedCategory(category.name);
                setNewLabel(e.target.value);
              }}
              fullWidth
              multiline={isBatchMode}
              minRows={isBatchMode ? 2 : 1}
            />
            <Button
              onClick={() =>
                handleAddLabel(
                  selectedCategory,
                  newLabel,
                  labelCategories,
                  isBatchMode,
                  setLabelCategories,
                  setNewLabel,
                )
              }
              variant="contained"
              disabled={!newLabel.trim()}
              sx={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-color)',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'var(--primary-hover)' },
                '&:active': { backgroundColor: 'var(--primary-active)' },
              }}
            >
              Add Label
            </Button>
          </Box>

          {/* Toggle Batch Mode */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Button
              onClick={() => {
                setIsBatchMode((prev) => !prev);
                setNewLabel('');
              }}
              size="small"
              sx={{
                fontSize: '0.8rem',
                textTransform: 'none',
                color: 'gray',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {isBatchMode
                ? 'Switch to single label mode'
                : 'Switch to batch label mode'}
            </Button>
            <Tooltip
              title={
                isBatchMode
                  ? 'Single label mode allows adding one label at a time.'
                  : 'Batch mode allows adding multiple labels at once, separated by commas or new lines.'
              }
            >
              <HelpOutlineIcon sx={{ fontSize: '1rem', color: 'gray' }} />
            </Tooltip>
          </Box>
        </Box>
      ))}

      <Box sx={{ pl: 1.5, mt: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowMultipleLabels}
              onChange={(e) => setAllowMultipleLabels(e.target.checked)}
              sx={{ p: 0.5 }}
            />
          }
          label="Allow selection of multiple labels in a category?"
        />
      </Box>

      {annotationType !== 'poetry' && (
        <Box sx={{ pl: 1.5, mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Set label for "Mark all as" Button
          </Typography>
          <TextField
            select
            size="small"
            fullWidth
            SelectProps={{ native: true }}
            value={markAllAsLabel}
            onChange={(e) => setMarkAllAsLabel(e.target.value)}
          >
            <option value="">-- Select a label --</option>
            {labelCategories
              .flatMap((cat) => cat.labels)
              .map((label, idx) => (
                <option key={idx} value={label}>
                  {label}
                </option>
              ))}
          </TextField>
        </Box>
      )}
    </Box>
  );
};

export default LabelCategorySection;
