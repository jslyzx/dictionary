import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import LearningApp from './LearningApp'
import './index.css'
import './styles/learning.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LearningApp />
    </BrowserRouter>
  </React.StrictMode>
)