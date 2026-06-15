import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { env } from '../../../config/env'

export default function CandidateProfile() {
  const { id } = useParams()
  const [item, setItem] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`${env.API_BASE_URL}/admin/applications/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(setItem)
      .catch(() => setItem(null))
  }, [id])

  if (!item) return <div>Loading...</div>

  return (
    <div>
      <h2>{item.name}</h2>
      <p>{item.email}</p>
      <a href={item.resume_url} target="_blank" rel="noreferrer">Open resume</a>
    </div>
  )
}
