import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Masthead from './components/Masthead/Masthead';
import Navbar from './components/Navbar/Navbar';
import Newsletter from './components/Newsletter/Newsletter';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import ArticleDetail from './pages/ArticleDetail/ArticleDetail';
import AboutPage from './pages/About/AboutPage';

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState('all');

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
        <Newsletter />
        <Footer />
      </div>
    </BrowserRouter>
  );
}
