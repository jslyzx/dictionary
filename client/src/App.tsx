import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import DictionaryDetailPage from './pages/DictionaryDetailPage'
import DictionariesPage from './pages/DictionariesPage'
import WordsPage from './pages/WordsPage'
import WordDetailPage from './pages/WordDetailPage'
import PronunciationRulesPage from './pages/PronunciationRulesPage'
import PronunciationRuleDetailPage from './pages/PronunciationRuleDetailPage'
import PronunciationRuleEditPage from './pages/PronunciationRuleEditPage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />} path="/">
          <Route element={<Navigate replace to="/dictionaries" />} index />
          <Route element={<DictionariesPage />} path="dictionaries" />
          <Route element={<DictionaryDetailPage />} path="dictionaries/:id" />
          <Route element={<WordsPage />} path="words" />
          <Route element={<WordDetailPage />} path="words/:id" />
          <Route element={<PronunciationRulesPage />} path="pronunciation-rules" />
          <Route element={<PronunciationRuleDetailPage />} path="pronunciation-rules/:id" />
          <Route element={<PronunciationRuleEditPage />} path="pronunciation-rules/:id/edit" />
          <Route element={<PronunciationRuleEditPage />} path="pronunciation-rules/new" />
        </Route>
        <Route element={<Navigate replace to="/dictionaries" />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
