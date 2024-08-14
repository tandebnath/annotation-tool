import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

import Navbar from './components/Navbar';
import BookList from './components/BookList';
import Settings from './components/Settings';
import BookDetails from './components/BookDetails';

export default function App() {
  return (
    <Router>
      <CssBaseline />
      <Navbar />
      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/book/:bookId" element={<BookDetails />} />
      </Routes>
    </Router>
  );
}
