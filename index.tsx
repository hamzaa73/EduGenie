
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // دالة لإزالة شاشة التحميل بسلاسة
  const removeLoader = () => {
    const loader = document.getElementById('app-loading');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 500);
    }
  };

  // التنفيذ بعد فترة قصيرة لضمان أن المتصفح بدأ في عرض التطبيق
  if (document.readyState === 'complete') {
    setTimeout(removeLoader, 500);
  } else {
    window.addEventListener('load', () => setTimeout(removeLoader, 500));
  }
}
