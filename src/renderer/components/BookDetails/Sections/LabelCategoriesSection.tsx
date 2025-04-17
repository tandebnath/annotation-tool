import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { FiPlus } from 'react-icons/fi';
import AddLabelModalSection from './AddLabelModalSection';

interface LabelCategory {
  name: string;
  labels: string[];
}

interface LabelCategoriesSectionProps {
  labelCategories: LabelCategory[];
  annotationType: 'prose' | 'poetry';
  annotations: {
    bookId: string;
    page: string;
    state: string;
    category: string;
  }[];
  bookId: string;
  handleAnnotationClick: (
    page: string,
    label: string,
    category: string,
  ) => Promise<void>;
  isStateActive: (page: string, label: string, category: string) => boolean;
  setSelectedCategory: (category: string) => void;

  // Modal control props
  openLabelModal: boolean;
  setOpenLabelModal: (open: boolean) => void;
  selectedCategory: string;
  newLabel: string;
  onLabelChange: (label: string) => void;
  persistLabel: boolean;
  onPersistChange: (checked: boolean) => void;
  onAddLabel: () => void;

  temporaryLabels?: Record<string, string[]>;
}

const LabelCategoriesSection: React.FC<LabelCategoriesSectionProps> = ({
  labelCategories,
  annotations,
  bookId,
  handleAnnotationClick,
  annotationType,
  isStateActive,
  openLabelModal,
  setOpenLabelModal,
  selectedCategory,
  setSelectedCategory,
  newLabel,
  onLabelChange,
  persistLabel,
  onPersistChange,
  onAddLabel,
  temporaryLabels = {},
}) => {
  return (
    <>
      {labelCategories && labelCategories.length > 0 ? (
        labelCategories.map((category) => (
          <Box key={category.name} sx={{ marginBottom: '1rem' }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                color: 'var(--text-color)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {category.name}
              <IconButton
                size="small"
                onClick={() => {
                  onLabelChange('');
                  onPersistChange(false);
                  setSelectedCategory(category.name);
                  setOpenLabelModal(true);
                }}
                sx={{ color: 'var(--secondary-main)' }}
              >
                <FiPlus />
              </IconButton>
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(() => {
                const persisted = category.labels || [];
                const temp = temporaryLabels[category.name] || [];

                const allLabels = [...persisted, ...temp];
                if (allLabels.length === 0) {
                  return (
                    <Typography sx={{ color: 'gray' }}>
                      No labels available
                    </Typography>
                  );
                }

                return allLabels.map((label, index) => {
                  const isTemp = temp.includes(label);
                  return (
                    <Button
                      key={index}
                      variant="contained"
                      sx={{
                        backgroundColor: isStateActive(
                          bookId,
                          label,
                          category.name,
                        )
                          ? 'var(--proceed-color)'
                          : 'var(--primary-color)',
                        color: 'var(--text-color)',
                        fontWeight: 'bold',
                        border: isTemp
                          ? '2px dashed var(--accent-border)'
                          : undefined,
                        opacity: isTemp ? 0.85 : 1,
                      }}
                      onClick={() =>
                        handleAnnotationClick(
                          annotationType === 'poetry' ? 'poetry' : bookId,
                          label,
                          category.name,
                        )
                      }
                      title={
                        isTemp ? 'Temporary label (not in global settings)' : ''
                      }
                    >
                      {label}
                      {isTemp && ' *'}
                    </Button>
                  );
                });
              })()}
            </Box>
          </Box>
        ))
      ) : (
        <Typography sx={{ color: 'gray' }}>No categories available</Typography>
      )}

      {/* Modal */}
      <AddLabelModalSection
        open={openLabelModal}
        selectedCategory={selectedCategory}
        newLabel={newLabel}
        persistLabel={persistLabel}
        onClose={() => setOpenLabelModal(false)}
        onLabelChange={onLabelChange}
        onPersistChange={onPersistChange}
        onAddLabel={onAddLabel}
      />
    </>
  );
};

export default LabelCategoriesSection;
