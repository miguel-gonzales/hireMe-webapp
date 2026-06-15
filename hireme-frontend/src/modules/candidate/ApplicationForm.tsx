import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { env } from '../../../config/env'
import styles from './ApplicationForm.module.css'

const ENGLISH_LEVELS = [
  'Beginner (A1/A2)',
  'Intermediate (B1/B2)',
  'Advanced (C1)',
  'Native / Fluent (C2)',
] as const

const MAX_PDF_SIZE = 5 * 1024 * 1024

const Schema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(1, 'Phone is required').max(30),
  age: z.coerce.number().int().min(16, 'Must be at least 16').max(100, 'Must be at most 100'),
  country: z.string().min(1, 'Country is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
  english_level: z.enum(ENGLISH_LEVELS),
  resume: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'A PDF resume is required')
    .refine((files) => files[0]?.type === 'application/pdf', 'Invalid file format. Only PDF files are permitted.')
    .refine((files) => files[0]?.size <= MAX_PDF_SIZE, 'File must be smaller than 5MB'),
})

type FormValues = z.infer<typeof Schema>

export default function ApplicationForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setSuccessMessage(null)

    const formData = new FormData()
    formData.append('full_name', values.full_name)
    formData.append('email', values.email)
    formData.append('phone', values.phone)
    formData.append('age', String(values.age))
    formData.append('country', values.country)
    formData.append('city', values.city)
    formData.append('english_level', values.english_level)
    formData.append('resume', values.resume[0])

    const response = await fetch(`${env.API_BASE_URL}/applications`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      setServerError(result?.error ?? 'Submission failed')
      return
    }

    const result = await response.json().catch(() => null)
    setSuccessMessage(result?.message ?? 'Application submitted successfully')
    reset()
  }

  return (
    <main className={styles.container}>
      <h1>Apply Now</h1>

      {successMessage && (
        <div role="status" className={styles.successMessage}>
          {successMessage}
        </div>
      )}

      {serverError && (
        <div role="alert" className={styles.errorMessage}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="full_name">Full Name</label>
          <input id="full_name" {...register('full_name')} />
          {errors.full_name && <p className={styles.errorText} role="alert">{errors.full_name.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" {...register('email')} />
          {errors.email && <p className={styles.errorText} role="alert">{errors.email.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone">Phone</label>
          <input id="phone" {...register('phone')} />
          {errors.phone && <p className={styles.errorText} role="alert">{errors.phone.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="age">Age</label>
          <input id="age" type="number" {...register('age')} />
          {errors.age && <p className={styles.errorText} role="alert">{errors.age.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="country">Country</label>
          <input id="country" {...register('country')} />
          {errors.country && <p className={styles.errorText} role="alert">{errors.country.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="city">City</label>
          <input id="city" {...register('city')} />
          {errors.city && <p className={styles.errorText} role="alert">{errors.city.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="english_level">English Level</label>
          <select id="english_level" defaultValue="" {...register('english_level')}>
            <option value="" disabled>
              Select level...
            </option>
            {ENGLISH_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {errors.english_level && <p className={styles.errorText} role="alert">{errors.english_level.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="resume">CV / Resume (PDF only, max 5MB)</label>
          <input id="resume" type="file" accept="application/pdf" {...register('resume')} />
          {errors.resume && <p className={styles.errorText} role="alert">{errors.resume.message}</p>}
        </div>

        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </main>
  )
}
