import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Theme sheet is imported last so the theme token blocks and the
// [data-theme="…"] layout overrides win over component defaults.
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
