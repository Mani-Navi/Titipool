import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { validateEnv } from './config/validateEnv';
import { initAnalytics } from './utils/analytics';
import App from './App.jsx';
import './index.css';

// اعتبارسنجی حیاتی محیط پروداکشن بر اساس قانون شماره ۸
validateEnv();

// مقداردهی اولیه سرویس تحلیل داده سبک و سازگار با حریم خصوصی
initAnalytics();

// پلی‌فیل سراسری برای کتابخانه‌های سوکت تحت مرورگر
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = window.process || { env: {} };
}

const rootElement = document.getElementById('root');

if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}