export type EnglishLevel =
  | 'Beginner (A1/A2)'
  | 'Intermediate (B1/B2)'
  | 'Advanced (C1)'
  | 'Native / Fluent (C2)';

export type ApplicationStatus = 'In Review' | 'Accepted' | 'Rejected';

export interface ApplicationRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  country: string;
  city: string;
  english_level: EnglishLevel;
  resume_storage_path: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationResponse extends Omit<ApplicationRow, 'resume_storage_path'> {
  resume_url: string;
}

export interface RecruitingUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}
