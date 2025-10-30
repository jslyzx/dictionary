import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import DictionaryDetailPage from './pages/DictionaryDetailPage'
import DictionariesPage from './pages/DictionariesPage'
import WordsPage from './pages/WordsPage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />} path="/">
          <Route element={<Navigate replace to="/dictionaries" />} index />
          <Route element={<DictionariesPage />} path="dictionaries" />
          <Route element={<DictionaryDetailPage />} path="dictionaries/:id" />
          <Route element={<WordsPage />} path="words" />
        </Route>
        <Route element={<Navigate replace to="/dictionaries" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
