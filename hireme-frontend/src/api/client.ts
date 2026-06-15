export class ApiError extends Error {
  status: number
  body: any
  constructor(status: number, body: any) {
    super(body?.message || 'API Error')
    this.status = status
    this.body = body
  }
}

export async function apiFetch(path: string, opts?: RequestInit) {
  const url = `${env.API_BASE_URL}${path}`
  const res = await fetch(url, { credentials: 'include', ...opts })
  const text = await res.text()
  let json: any = undefined
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {}
  if (!res.ok) throw new ApiError(res.status, json)
  return json
}

import { env } from '../../config/env'
