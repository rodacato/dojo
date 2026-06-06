import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/main.css'
import { App } from './App'
import { installGlobalHandlers } from './lib/observability'
import { initTheme } from './lib/theme'

installGlobalHandlers()
initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
