import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import './config/themes/theme-blue.css';
import './config/themes/theme-gruvbox.css';
import './config/themes/theme-nord.css';
import './config/themes/theme-purple.css';

import { App } from './app';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
