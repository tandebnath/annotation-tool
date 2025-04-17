import React, { useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import styles from './Cabinet.module.scss';

interface CabinetProps {
  children: React.ReactNode[];
}

const Cabinet: React.FC<CabinetProps> = ({ children }) => {
  const cabinetRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<HTMLDivElement | null>(null);
  const [booksPerShelf, setBooksPerShelf] = useState<number | null>(null);
  const [shelves, setShelves] = useState<React.ReactNode[][]>([]);

  // Measure book and cabinet width once bookRef is available
  useEffect(() => {
    if (!cabinetRef.current || !bookRef.current) return;

    const containerWidth = cabinetRef.current.clientWidth;
    const bookWidth = bookRef.current.clientWidth;

    if (bookWidth === 0) return; // Wait until the book has rendered

    const gap = 16;
    const count = Math.floor((containerWidth + gap) / (bookWidth + gap)) || 1;

    setBooksPerShelf(count);
  }, [children]);

  // Once booksPerShelf is known, split books into shelves
  useEffect(() => {
    if (!booksPerShelf || booksPerShelf < 1) return;

    const newShelves: React.ReactNode[][] = [];
    for (let i = 0; i < children.length; i += booksPerShelf) {
      newShelves.push(children.slice(i, i + booksPerShelf));
    }

    setShelves(newShelves);
  }, [children, booksPerShelf]);

  return (
    <Box className={styles.cabinet} ref={cabinetRef}>
      <Box className={styles['cabinet-top']} />
      <Box className={styles['cabinet-back']} />

      {/* 1. Invisible book to measure width */}
      {booksPerShelf === null && (
        <Box className={styles.shelf} sx={{ visibility: 'hidden', height: 0 }}>
          <Box className={styles.bookContainer}>
            <Box className={styles.book} ref={bookRef}>
              {children[0]}
            </Box>
          </Box>
        </Box>
      )}

      {/* 2. Actual shelves */}
      {booksPerShelf !== null &&
        shelves.map((shelfBooks, shelfIndex) => (
          <Box key={shelfIndex} className={styles.shelf}>
            <Box className={styles.base} />
            <Box className={styles.front} />
            <Box className={styles.bookContainer}>
              {shelfBooks.map((book, idx) => (
                <Box
                  key={idx}
                  className={styles.book}
                  sx={{ marginRight: '1rem' }}
                >
                  {book}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
    </Box>
  );
};

export default Cabinet;