import React from 'react'
import { useNavigate } from 'react-router-dom'
import { env } from '../../../config/env'

export default function LoginPage() {
  const navigate = useNavigate()
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    else alert('Invalid credentials')
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 400 }}>
      <div>
        <label>Email</label>
        <input name="email" />
      </div>
      <div>
        <label>Password</label>
        <input name="password" type="password" />
      </div>
      <button type="submit">Login</button>
    </form>
  )
}
