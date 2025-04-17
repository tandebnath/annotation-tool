import React from 'react';
import { Box, Typography } from '@mui/material';

interface MetadataField {
  column: string;
  label: string;
}

interface BookMetadataProps {
  bookId: string;
  bookMetadata: Record<string, string>;
  metadataFields?: MetadataField[];
}

const BookMetadataSection: React.FC<BookMetadataProps> = ({ bookId, bookMetadata, metadataFields }) => {
  return (
    <Box sx={{ marginBottom: '2rem' }}>
      <Typography sx={{ fontSize: '1.25rem' }}>
        <strong>ID:</strong> {bookId}
      </Typography>

      {bookMetadata &&
        Object.keys(bookMetadata).length > 0 &&
        metadataFields?.map((field) => (
          <Typography key={field.column} sx={{ fontSize: '1.25rem' }}>
            <strong>{field.label}:</strong>{' '}
            {bookMetadata?.[field.column] || 'N/A'}
          </Typography>
        ))}
    </Box>
  );
};

export default BookMetadataSection;
