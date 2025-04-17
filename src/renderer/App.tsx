import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

import Navbar from './components/Navbar';
import InitialRedirect from './components/settings/InitialRedirect';
import BookList from './components/BookList/BookList';
import BookDetails from './components/BookDetails/BookDetails';
import SessionSelection from './components/settings/SessionSelection';
import AnnotationTypeSelection from './components/settings/AnnotationTypeSelection';
import AnnotationSettings from './components/settings/AnnotationSettings';
import { SessionProvider } from './context/SessionContext';


import './App.css';

export default function App() {
  return (
    <SessionProvider>
      <Router>
        <CssBaseline />
        <Navbar />
        <Box sx={{ minHeight: '100vh' }}>
          <Routes>
            {/* Initial Route */}
            <Route path="/" element={<InitialRedirect />} />

            {/* Book Routes */}
            <Route path="/books" element={<BookList />} />
            <Route path="/book/:bookId" element={<BookDetails />} />

            {/* Settings Routes */}
            <Route path="/settings" element={<SessionSelection />} />
            <Route
              path="/settings/select-type"
              element={<AnnotationTypeSelection />}
            />
            <Route
              path="/settings/annotation-settings"
              element={<AnnotationSettings />}
            />

            {/* Catch-all: redirect unknown paths */}
            <Route path="*" element={<InitialRedirect />} />
          </Routes>
        </Box>
      </Router>
    </SessionProvider>
  );
}
