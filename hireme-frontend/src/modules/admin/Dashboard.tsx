import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { env } from '../../../config/env'
import { Application } from '../../shared/types'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${env.API_BASE_URL}/admin/applications`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) {
            navigate('/admin/login')
            return
          }
          throw new Error('Failed to load applications')
        }
        return r.json()
      })
      .then((data) => setApplications(data))
      .catch((err) => setError(err.message))
  }, [])

  async function handleLogout() {
    await fetch(`${env.API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    navigate('/admin/login')
  }

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
  if (!applications) return <div>Loading...</div>
  if (applications.length === 0) return <div>No applications yet</div>

  return (
    <div>
      <div className={styles.header}>
        <h2>Candidate Dashboard</h2>
        <button className={styles.logoutButton} onClick={handleLogout}>Log out</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>{app.full_name}</td>
              <td>{app.email}</td>
              <td>
                <span className={`${styles.statusBadge} ${app.status === 'Accepted' ? styles.statusAccepted : app.status === 'Rejected' ? styles.statusRejected : styles.statusReview}`}>
                  {app.status}
                </span>
              </td>
              <td>
                <Link to={`/admin/applications/${app.id}`} className={styles.viewLink}>
                  View Profile
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
