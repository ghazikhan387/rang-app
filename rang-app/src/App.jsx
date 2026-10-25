import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Masthead from './components/Masthead/Masthead';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import ArticleDetail from './pages/ArticleDetail/ArticleDetail';
import AboutPage from './pages/About/AboutPage';
import DevelopmentReports from './pages/DevelopmentReports/DevelopmentReports';
import AISummaries from './pages/AISummaries/AISummaries';

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState('US'); // United States is the default news view

  return (
    <BrowserRouter>
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Masthead />
        <Navbar
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  selectedCountry={selectedCountry}
                  onCountryChange={setSelectedCountry}
                />
              }
            />
            {/* Consolidated US Healthcare Development Reports (replaces Timeline) */}
            <Route path="/timeline" element={<DevelopmentReports />} />
            <Route path="/reports" element={<DevelopmentReports />} />
            <Route path="/healthcare-reports" element={<DevelopmentReports />} />
            <Route path="/healthcare-news" element={<DevelopmentReports />} />

            {/* Existing individual article summaries preserved */}
            <Route path="/article-summaries" element={<AISummaries />} />

            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Fallback route */}
            <Route
              path="*"
              element={
                <HomePage
                  selectedCountry={selectedCountry}
                  onCountryChange={setSelectedCountry}
                />
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
