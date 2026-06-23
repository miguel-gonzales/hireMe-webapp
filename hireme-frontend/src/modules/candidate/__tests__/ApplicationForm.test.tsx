import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApplicationForm from '../ApplicationForm'

// Mock the env module (path resolves to project-root config/env.ts)
vi.mock('../../../../config/env', () => ({
  env: {
    API_BASE_URL: 'http://localhost:3000',
  },
}))

// Mock fetch globally
global.fetch = vi.fn()

function createFileList(...files: File[]): FileList {
  const list = Object.assign([...files], {
    item: (index: number) => files[index] ?? null,
  })
  Object.setPrototypeOf(list, FileList.prototype)
  return list as unknown as FileList
}

function uploadFile(input: HTMLElement, file: File) {
  fireEvent.change(input, { target: { files: createFileList(file) } })
}

describe('ApplicationForm - CV Upload Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReset()
  })

  /**
   * Test 1: CV upload - file type validation (only PDF allowed)
   */
  it('should show error when non-PDF file is selected', async () => {
    render(<ApplicationForm />)
    // Fill required fields so resume validation runs
    await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '1234567890')
    await userEvent.type(screen.getByLabelText(/Age/i), '28')
    await userEvent.type(screen.getByLabelText(/Country/i), 'USA')
    await userEvent.type(screen.getByLabelText(/City/i), 'New York')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Advanced (C1)')

    const fileInput = screen.getByLabelText(/CV \/ Resume/i)
    const file = new File(['content'], 'resume.txt', { type: 'text/plain' })
    uploadFile(fileInput, file)

    const button = screen.getByRole('button', { name: /Submit Application/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Invalid file format. Only PDF files are permitted\./i)).toBeInTheDocument()
    })
  })

  /**
   * Test 2: CV upload - file size validation (max 5MB)
   */
  it('should show error when PDF file exceeds 5MB', async () => {
    render(<ApplicationForm />)
    // Fill other required fields
    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Big File')
    await userEvent.type(screen.getByLabelText(/Email/i), 'bigfile@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '2222222222')
    await userEvent.type(screen.getByLabelText(/Age/i), '40')
    await userEvent.type(screen.getByLabelText(/Country/i), 'USA')
    await userEvent.type(screen.getByLabelText(/City/i), 'LA')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Advanced (C1)')

    const fileInput = screen.getByLabelText(/CV \/ Resume/i)
    // Create a file larger than 5MB
    const largeFile = new File([new Array(6 * 1024 * 1024).fill('x').join('')], 'resume.pdf', {
      type: 'application/pdf',
    })

    await userEvent.upload(fileInput, largeFile)

    const button = screen.getByRole('button', { name: /Submit Application/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/File must be smaller than 5MB/i)).toBeInTheDocument()
    })
  })

  /**
   * Test 3: CV upload - required field validation
   */
  it('should show error when CV/Resume field is empty', async () => {
    render(<ApplicationForm />)
    // Fill other required fields but leave resume empty
    await userEvent.type(screen.getByLabelText(/Full Name/i), 'No Resume')
    await userEvent.type(screen.getByLabelText(/Email/i), 'noresume@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '4444444444')
    await userEvent.type(screen.getByLabelText(/Age/i), '22')
    await userEvent.type(screen.getByLabelText(/Country/i), 'USA')
    await userEvent.type(screen.getByLabelText(/City/i), 'Miami')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Beginner (A1/A2)')

    const button = screen.getByRole('button', { name: /Submit Application/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/A PDF resume is required/i)).toBeInTheDocument()
    })
  })

  /**
   * Test 4: CV upload - successful file upload with valid PDF
   */
  it('should accept valid PDF file (< 5MB)', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Application submitted successfully' }),
    })

    render(<ApplicationForm />)

    // Fill all form fields
    await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/Email/i), 'john@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '1234567890')
    await userEvent.type(screen.getByLabelText(/Age/i), '28')
    await userEvent.type(screen.getByLabelText(/Country/i), 'USA')
    await userEvent.type(screen.getByLabelText(/City/i), 'New York')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Advanced (C1)')

    // Upload valid PDF
    const fileInput = screen.getByLabelText(/CV \/ Resume/i)
    const validFile = new File(['PDF content'], 'resume.pdf', { type: 'application/pdf' })
    await userEvent.upload(fileInput, validFile)

    const button = screen.getByRole('button', { name: /Submit Application/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Application submitted successfully/i)).toBeInTheDocument()
    })
  })

  /**
   * Test 5: CV upload - form submission with file in FormData
   */
  it('should send CV file in FormData when submitting application', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
    })

    render(<ApplicationForm />)

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Jane Smith')
    await userEvent.type(screen.getByLabelText(/Email/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '9876543210')
    await userEvent.type(screen.getByLabelText(/Age/i), '32')
    await userEvent.type(screen.getByLabelText(/Country/i), 'Canada')
    await userEvent.type(screen.getByLabelText(/City/i), 'Toronto')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Native / Fluent (C2)')

    const fileInput = screen.getByLabelText(/CV \/ Resume/i)
    const file = new File(['PDF content'], 'resume.pdf', { type: 'application/pdf' })
    await userEvent.upload(fileInput, file)

    await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/applications',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )
    })
  })

  /**
   * Test 6: CV upload - error handling on server failure
   */
  it('should display server error when CV upload fails', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'File upload failed' }),
    })

    render(<ApplicationForm />)

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Bob Johnson')
    await userEvent.type(screen.getByLabelText(/Email/i), 'bob@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '5555555555')
    await userEvent.type(screen.getByLabelText(/Age/i), '25')
    await userEvent.type(screen.getByLabelText(/Country/i), 'UK')
    await userEvent.type(screen.getByLabelText(/City/i), 'London')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Intermediate (B1/B2)')

    const fileInput = screen.getByLabelText(/CV \/ Resume/i)
    const file = new File(['PDF'], 'resume.pdf', { type: 'application/pdf' })
    await userEvent.upload(fileInput, file)

    await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('File upload failed')
    })
  })

  /**
   * Test 7: CV upload - success message clears and form resets
   */
  it('should reset form after successful CV submission', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Application submitted' }),
    })

    render(<ApplicationForm />)

    const fullNameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
    const fileInput = screen.getByLabelText(/CV \/ Resume/i) as HTMLInputElement

    await userEvent.type(fullNameInput, 'Test User')
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '1111111111')
    await userEvent.type(screen.getByLabelText(/Age/i), '30')
    await userEvent.type(screen.getByLabelText(/Country/i), 'USA')
    await userEvent.type(screen.getByLabelText(/City/i), 'Boston')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Advanced (C1)')

    const file = new File(['PDF'], 'resume.pdf', { type: 'application/pdf' })
    uploadFile(fileInput, file)

    await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }))

    await waitFor(() => {
      expect(fullNameInput.value).toBe('')
      expect(emailInput.value).toBe('')
    })
  })

  /**
   * Test 8: CV upload - submit button disabled during upload
   */
  it('should disable submit button while file is being uploaded', async () => {
    let resolveResponse: any
    ;(global.fetch as any).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveResponse = resolve
      })
    )

    render(<ApplicationForm />)

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Upload Test')
    await userEvent.type(screen.getByLabelText(/Email/i), 'upload@test.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '3333333333')
    await userEvent.type(screen.getByLabelText(/Age/i), '28')
    await userEvent.type(screen.getByLabelText(/Country/i), 'USA')
    await userEvent.type(screen.getByLabelText(/City/i), 'Seattle')
    await userEvent.selectOptions(screen.getByLabelText(/English Level/i), 'Beginner (A1/A2)')

    const fileInput = screen.getByLabelText(/CV \/ Resume/i)
    const file = new File(['PDF'], 'resume.pdf', { type: 'application/pdf' })
    await userEvent.upload(fileInput, file)

    const submitButton = screen.getByRole('button', { name: /Submit Application/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })

    resolveResponse({
      ok: true,
      json: async () => ({ message: 'Success' }),
    })

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })
})
