import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AppStateProvider } from './state/AppStateContext.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProviderDataProvider } from './provider/providerStore.jsx'
import { ProviderAuthProvider } from './provider/ProviderAuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProviderDataProvider>
            <ProviderAuthProvider>
              <AppStateProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </AppStateProvider>
            </ProviderAuthProvider>
          </ProviderDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
