import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import EmailService to make it available globally for console testing
import './services/email-service'
import './utils/email-test-helpers'

createRoot(document.getElementById("root")!).render(<App />);
