import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { env } from '../../../config/env'

type App = { id: string; name: string; email: string }

export default function Dashboard() {
  const [items, setItems] = useState<App[] | null>(null)

  useEffect(() => {
    fetch(`${env.API_BASE_URL}/admin/applications`, { credentials: 'include' })
      .then(r => r.json())
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  if (!items) return <div>Loading...</div>
  if (items.length === 0) return <div>No applications</div>

  return (
    <div>
      <h2>Applications</h2>
      <ul>
        {items.map(i => (
          <li key={i.id}>
            <Link to={`/admin/applications/${i.id}`}>{i.name} — {i.email}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
