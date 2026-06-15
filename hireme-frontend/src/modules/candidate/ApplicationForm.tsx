import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { env } from '../../../config/env'

const Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().int().min(16).max(100).optional(),
  resume: z.instanceof(File).refine(f => f.type === 'application/pdf', 'PDF required')
})

type FormData = z.infer<typeof Schema>

export default function ApplicationForm() {
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(Schema as any)
  })

  async function onSubmit(data: any) {
    const fd = new FormData()
    fd.append('name', data.name)
    fd.append('email', data.email)
    if (data.age) fd.append('age', String(data.age))
    fd.append('resume', data.resume[0])

    const res = await fetch(`${env.API_BASE_URL}/applications`, {
      method: 'POST',
      body: fd
    })
    if (res.ok) alert('Application submitted')
    else alert('Submission failed')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 600 }}>
      <div>
        <label>Name</label>
        <input {...register('name' as any)} />
      </div>
      <div>
        <label>Email</label>
        <input {...register('email' as any)} />
      </div>
      <div>
        <label>Age</label>
        <input type="number" {...register('age' as any)} />
      </div>
      <div>
        <label>Resume (PDF)</label>
        <input type="file" accept="application/pdf" {...register('resume' as any)} />
      </div>
      <button type="submit">Submit</button>
      {formState.errors && <pre>{JSON.stringify(formState.errors, null, 2)}</pre>}
    </form>
  )
}
