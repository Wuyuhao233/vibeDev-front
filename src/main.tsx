import { createRoot } from 'react-dom/client';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
