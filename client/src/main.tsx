import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyPerfTier, detectPerfTier } from './utils/perf';

// Chọn mức hiệu ứng theo sức máy trước khi vẽ lần đầu (CSS dựa vào <html data-perf>)
applyPerfTier(detectPerfTier());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
