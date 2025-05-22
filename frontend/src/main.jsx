import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthForm from "./AuthForm.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthForm />
  </StrictMode>,
)
