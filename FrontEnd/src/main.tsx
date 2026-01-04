import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { CategoriesProvider } from './contexts/CategoriesContext'
import { NewsProvider } from './contexts/NewsContext'
import { MLeagueProvider } from './contexts/MLeagueContext'
import { ForumProvider } from './contexts/ForumContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CategoriesProvider>
          <NewsProvider>
            <MLeagueProvider>
              <ForumProvider>
              <App />
              </ForumProvider>
            </MLeagueProvider>
          </NewsProvider>
        </CategoriesProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
