export type ApplicationStatus = 'In Review' | 'Accepted' | 'Rejected'

export type EnglishLevel = 'Beginner (A1/A2)' | 'Intermediate (B1/B2)' | 'Advanced (C1)' | 'Native / Fluent (C2)'

export interface Application {
  id: string
  full_name: string
  email: string
  phone: string
  age: number
  country: string
  city: string
  english_level: EnglishLevel
  status: ApplicationStatus
  resume_url: string
  created_at: string
  updated_at: string
}
