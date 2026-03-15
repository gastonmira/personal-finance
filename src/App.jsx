import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import MonthlyView from './components/MonthlyView'
import EntryForm from './components/EntryForm'
import Reports from './components/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="mes" element={<MonthlyView />} />
          <Route path="ingresar" element={<EntryForm />} />
          <Route path="reportes" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
