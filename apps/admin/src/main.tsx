import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { HttpApiClient } from './api/client.js';
import { AdminApp } from './app.js';
import './styles/tokens.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(<StrictMode><AdminApp api={new HttpApiClient()} /></StrictMode>);
