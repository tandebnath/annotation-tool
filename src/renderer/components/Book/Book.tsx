// src/components/Book.tsx
import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

interface BookProps {
  folder: string;
  completion: number;
  metadata?: Record<string, string>;
  metadataFields?: { column: string; label: string; displayOnCover: boolean }[];
  onClick: () => void;
}

const Book: React.FC<BookProps> = ({
  folder,
  completion,
  metadata = {},
  metadataFields = [],
  onClick,
}) => {
  const backgroundGradient = `linear-gradient(to top, #AFE1AF ${completion}%, #FCF5E5 0%)`;
  const truncatedFolderName =
    folder.length > 20 ? `${folder.slice(0, 17)}...` : folder;

  const tooltipContent =
    metadataFields
      .filter((field) => field.displayOnCover)
      .map(
        (field) =>
          `<strong>${field.label}:</strong> ${
            metadata?.[field.column] || 'N/A'
          }`,
      )
      .join('<br />') || 'No metadata available';

  const displayedMetadata = metadataFields.filter((f) => f.displayOnCover);

  console.log('BOOK metadataFields:', metadataFields);
  console.log('BOOK metadata:', metadata);

  return (
    <Tooltip
      title={<span dangerouslySetInnerHTML={{ __html: tooltipContent }} />}
      arrow
      placement="top"
    >
      <Box
        sx={{
          width: '10rem',
          height: '12.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '25rem',
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        <Box
          sx={{
            transform: 'rotateY(-30deg)',
            position: 'relative',
            transformStyle: 'preserve-3d',
            width: '10rem',
            height: '12.5rem',
            transition: 'transform 1s ease',
            '&:hover': {
              transform: 'rotateY(0deg)',
            },
            '& > :first-of-type': {
              position: 'absolute',
              width: '10rem',
              height: '12.5rem',
              borderTopRightRadius: '0.1875rem',
              borderBottomRightRadius: '0.1875rem',
              // boxShadow: '0.3125rem 0.3125rem 1.25rem lightgray',
            },
            '&::before': {
              content: '""',
              background: '#fff',
              height: 'calc(12.5rem - 2 * 0.1875rem)',
              width: '2.5rem',
              top: '0.1875rem',
              position: 'absolute',
              transform:
                'translateX(calc(10rem - 2.5rem / 2 - 0.1875rem)) rotateY(90deg) translateX(calc(2.5rem / 2))',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: '0',
              width: '10rem',
              height: '12.5rem',
              borderTopRightRadius: '0.1875rem',
              borderBottomRightRadius: '0.1875rem',
              background: backgroundGradient,
              transform: 'translateZ(-2.5rem)',
              // boxShadow: '-0.625rem 0 3.125rem 0.625rem lightgray',
            },
          }}
        >
          <Box sx={{ background: backgroundGradient }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'black',
                zIndex: 1,
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              {metadata && displayedMetadata.length === 2 && (
                <Typography
                  variant="body2"
                  sx={{ marginBottom: '0.25rem', fontWeight: 600 }}
                >
                  {metadata[displayedMetadata[0].column]
                    ? `${metadata[displayedMetadata[0].column].slice(0, 25)}..`
                    : ''}
                </Typography>
              )}
              <Typography
                variant="body2"
                sx={{ margin: '0.75rem 0', fontStyle: 'italic' }}
              >
                {truncatedFolderName}
              </Typography>
              {metadata &&
                (displayedMetadata.length !== 2
                  ? displayedMetadata.map((field) => (
                      <Typography
                        key={field.column}
                        variant="body2"
                        sx={{ marginBottom: '0.25rem', fontWeight: 600 }}
                      >
                        {metadata[field.column]
                          ? `${metadata[field.column].slice(0, 25)}..`
                          : ''}
                      </Typography>
                    ))
                  : metadata[displayedMetadata[1].column] && (
                      <Typography
                        variant="body2"
                        sx={{ marginTop: '0.25rem', fontWeight: 600 }}
                      >
                        {metadata[displayedMetadata[1].column]
                          ? `${metadata[displayedMetadata[1].column].slice(0, 25)}..`
                          : ''}
                      </Typography>
                    ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default Book;
