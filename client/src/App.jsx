import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout.jsx';
import DictionariesList from './pages/DictionariesList.jsx';
import DictionaryDetail from './pages/DictionaryDetail.jsx';

function App() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="/dictionaries" replace />} />
        <Route path="/dictionaries" element={<DictionariesList />} />
        <Route path="/dictionaries/:id" element={<DictionaryDetail />} />
        <Route path="*" element={<Navigate to="/dictionaries" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: '0.95rem'
          }
        }}
      />
    </Layout>
  );
}

export default App;
