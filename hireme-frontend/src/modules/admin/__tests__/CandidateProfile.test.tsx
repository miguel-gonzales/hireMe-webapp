import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import CandidateProfile from '../CandidateProfile'
import { Application } from '../../shared/types'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '123' }),
    useNavigate: () => mockNavigate,
  }
})

// Mock the env module to ensure API_BASE_URL is predictable
vi.mock('../../../config/env', () => ({
  env: { API_BASE_URL: 'http://localhost:3000' },
}))

// Mock fetch globally
global.fetch = vi.fn()

// Mock application data
const mockApplication: Application = {
  id: '123',
  full_name: 'John Candidate',
  email: 'candidate@example.com',
  phone: '1234567890',
  age: 28,
  country: 'USA',
  city: 'New York',
  english_level: 'Advanced (C1)',
  status: 'In Review',
  resume_url: 'https://example.com/resumes/john-resume.pdf',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('CandidateProfile - CV Status Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
    mockNavigate.mockClear()
  })

  /**
   * Test 9: CV status display - shows resume link when resume_url is present
   */
  it('should display CV/Resume link when resume_url is available', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplication,
    })

    renderWithRouter(<CandidateProfile />)

    await waitFor(() => {
      const resumeLink = screen.getByRole('link', { name: /Open PDF Resume/i })
      expect(resumeLink).toBeInTheDocument()
      expect(resumeLink).toHaveAttribute('href', mockApplication.resume_url)
      expect(resumeLink).toHaveAttribute('target', '_blank')
    })
  })

  /**
   * Test 10: CV status update - changes and persists application status
   */
  it('should update CV status when changed from "In Review" to "Accepted"', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplication,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockApplication,
          status: 'Accepted',
        }),
      })

    renderWithRouter(<CandidateProfile />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('In Review')).toBeInTheDocument()
    })

    const statusSelect = screen.getByLabelText(/Current Status/i)
    await userEvent.selectOptions(statusSelect, 'Accepted')

    // Verify the status update API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/applications\/123\/status$/),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'Accepted' }),
        })
      )
    })

    // Verify the new status is displayed
    await waitFor(() => {
      expect(screen.getByDisplayValue('Accepted')).toBeInTheDocument()
    })
  })

  // (Removed bonus test to keep test count at 10)
})
