import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { env } from '../../../config/env'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const form = new FormData(e.target as HTMLFormElement)
    const res = await fetch(`${env.API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password')
      }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    if (res.ok) navigate('/admin/dashboard')
    else setServerError('Invalid credentials')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Recruiter Login</h1>
      {serverError && <div className={styles.errorMessage} role="alert">{serverError}</div>}
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" />
        </div>
        <button type="submit" className={styles.button}>Login</button>
      </form>
    </div>
  )
}
