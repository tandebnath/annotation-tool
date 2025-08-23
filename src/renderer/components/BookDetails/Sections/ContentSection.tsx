import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Divider,
  Button,
} from '@mui/material';
import LabelCategoriesSection from './LabelCategoriesSection';

interface Page {
  fileName: string;
  content: string;
}

interface LabelCategory {
  name: string;
  labels: string[];
}

interface ContentSectionProps {
  annotationType: 'prose' | 'poetry';
  visiblePages: Page[];
  states: string[];
  annotations: { page: string; state: string; category: string }[];
  onAnnotationClick: (
    page: string,
    state: string,
    category: string,
  ) => Promise<void>;
  labelCategories: LabelCategory[];
  setSelectedCategory: (category: string) => void;
  bookId: string;
  isStateActive: (page: string, state: string, category: string) => boolean;
  openLabelModal: boolean;
  setOpenLabelModal: (open: boolean) => void;
  selectedCategory: string;
  newLabel: string;
  onLabelChange: (label: string) => void;
  persistLabel: boolean;
  onPersistChange: (checked: boolean) => void;
  onAddLabel: () => void;
  temporaryLabels: any;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  annotationType,
  visiblePages,
  states,
  annotations,
  onAnnotationClick,
  labelCategories,
  bookId,
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
  temporaryLabels,
}) => {
  if (annotationType === 'poetry') {
    return (
      <Box sx={{ marginBottom: '2rem' }}>
        <Card sx={{ marginBottom: '2rem', padding: '1.5rem 1.5rem 0' }}>
          <Typography
            variant="h6"
            sx={{
              color: 'var(--secondary-color)',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
            }}
          >
            Poem Content
          </Typography>
          {visiblePages.map((page, idx) => (
            <Typography
              key={idx}
              sx={{ marginBottom: '1rem', whiteSpace: 'pre-line' }}
            >
              {page.content}
            </Typography>
          ))}

          <Divider sx={{ margin: '1rem 0' }} />

          <LabelCategoriesSection
            labelCategories={labelCategories}
            annotationType={annotationType}
            annotations={annotations.map((a) => ({ ...a, bookId }))}
            bookId={bookId}
            handleAnnotationClick={onAnnotationClick}
            isStateActive={isStateActive}
            openLabelModal={openLabelModal}
            setOpenLabelModal={setOpenLabelModal}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            newLabel={newLabel}
            onLabelChange={onLabelChange}
            persistLabel={persistLabel}
            onPersistChange={onPersistChange}
            onAddLabel={onAddLabel}
            temporaryLabels={temporaryLabels}
          />
        </Card>
      </Box>
    );
  }

  return (
    <>
      {visiblePages.map((page, index) => {
        const pageAnnotations = annotations
          .filter((a) => a.page === page.fileName)
          .map((a) => ({ ...a, bookId }));

        return (
          <React.Fragment key={index}>
            <Card sx={{ marginBottom: '2rem' }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}
                >
                  Page {parseInt(page.fileName.replace('.txt', ''), 10)}
                </Typography>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {page.content}
                </pre>
              </CardContent>

              <Divider sx={{ margin: '0.25rem 0' }} />

              <Box sx={{ padding: '1rem' }}>
                <LabelCategoriesSection
                  labelCategories={labelCategories}
                  annotationType={annotationType}
                  annotations={pageAnnotations}
                  bookId={bookId}
                  pageId={page.fileName}
                  handleAnnotationClick={onAnnotationClick}
                  isStateActive={isStateActive}
                  openLabelModal={openLabelModal}
                  setOpenLabelModal={setOpenLabelModal}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  newLabel={newLabel}
                  onLabelChange={onLabelChange}
                  persistLabel={persistLabel}
                  onPersistChange={onPersistChange}
                  onAddLabel={onAddLabel}
                  temporaryLabels={temporaryLabels}
                />
              </Box>
            </Card>

            {index % 2 !== 0 && <Divider sx={{ marginBottom: '2rem' }} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default ContentSection;
