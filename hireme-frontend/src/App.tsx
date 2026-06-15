import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import ApplicationForm from './modules/candidate/ApplicationForm'
import AdminLogin from './modules/admin/LoginPage'
import Dashboard from './modules/admin/Dashboard'
import CandidateProfile from './modules/admin/CandidateProfile'

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <nav>
        <Link to="/">Apply</Link> | <Link to="/admin/login">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ApplicationForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/applications/:id" element={<CandidateProfile />} />
      </Routes>
    </div>
  )
}
