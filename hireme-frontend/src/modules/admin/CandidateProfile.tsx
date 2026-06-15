import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { env } from '../../../config/env'
import { Application, ApplicationStatus } from '../../shared/types'
import styles from './CandidateProfile.module.css'

const STATUS_OPTIONS: ApplicationStatus[] = ['In Review', 'Accepted', 'Rejected']

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`${env.API_BASE_URL}/admin/applications/${id}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) {
            navigate('/admin/login')
            return null
          }
          throw new Error('Application not found')
        }
        return r.json()
      })
      .then((data) => data && setApplication(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!application) return
    const newStatus = e.target.value as ApplicationStatus
    setUpdating(true)

    try {
      const res = await fetch(`${env.API_BASE_URL}/admin/applications/${application.id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update status')

      const updated = await res.json()
      setApplication(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
  if (!application) return <div>Application not found</div>

  return (
    <main className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/admin/dashboard')}>
        ← Back
      </button>

      <h1 className={styles.title}>{application.full_name}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <table className={styles.detailsTable}>
          <tbody>
            <tr>
              <td className={styles.detailsLabel}>Email:</td>
              <td>{application.email}</td>
            </tr>
            <tr>
              <td className={styles.detailsLabel}>Phone:</td>
              <td>{application.phone}</td>
            </tr>
            <tr>
              <td className={styles.detailsLabel}>Age:</td>
              <td>{application.age}</td>
            </tr>
            <tr>
              <td className={styles.detailsLabel}>Country:</td>
              <td>{application.country}</td>
            </tr>
            <tr>
              <td className={styles.detailsLabel}>City:</td>
              <td>{application.city}</td>
            </tr>
            <tr>
              <td className={styles.detailsLabel}>English Level:</td>
              <td>{application.english_level}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>CV / Resume</h2>
        {application.resume_url ? (
          <a
            href={application.resume_url}
            target="_blank"
            rel="noreferrer"
            className={styles.resumeLink}
          >
            📄 Open PDF Resume
          </a>
        ) : (
          <p>No resume available</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pipeline Status</h2>
        <div className={styles.statusContainer}>
          <label htmlFor="status-select" className={styles.statusLabel}>
            Current Status:
          </label>
          <select
            id="status-select"
            value={application.status}
            onChange={handleStatusChange}
            disabled={updating}
            className={styles.statusSelect}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {updating && <span className={styles.savingText}>Saving...</span>}
        </div>
      </section>
    </main>
  )
}
