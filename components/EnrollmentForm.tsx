'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const BANK_DETAILS = {
  accountName: 'Education Institute Ltd',
  accountNumber: '1234567890',
  bankName: 'Example Bank',
  routingNumber: '123456789',
}

export default function EnrollmentForm({
  courseId,
  coursePrice,
}: {
  courseId: string
  coursePrice: number
}) {
  const [step, setStep] = useState<'info' | 'upload'>('info')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!file) {
      setError('Please select a bank slip image')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      formData.append('amount', coursePrice.toString())

      const response = await fetch('/api/payments/upload-slip', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload bank slip')
        return
      }

      setSuccess(true)
      setFile(null)
      setStep('info')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            ✓ Bank slip uploaded successfully!
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
            Admin will review and approve your enrollment within 24 hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {step === 'info' ? (
        <>
          <div className="space-y-3 text-sm bg-secondary/20 p-4 rounded-md border border-border">
            <p className="font-semibold text-foreground">Bank Account Details:</p>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Account Name:</span>
                <span className="font-mono font-semibold text-foreground">{BANK_DETAILS.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span>Account Number:</span>
                <span className="font-mono font-semibold text-foreground">{BANK_DETAILS.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Bank Name:</span>
                <span className="font-mono font-semibold text-foreground">{BANK_DETAILS.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span>Routing Number:</span>
                <span className="font-mono font-semibold text-foreground">{BANK_DETAILS.routingNumber}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-4">
              Transfer ${Number(coursePrice).toFixed(2)} to the account above, then upload proof of payment.
            </p>
            <Button
              onClick={() => setStep('upload')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Upload Payment Proof
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="slip" className="text-sm font-medium text-foreground">
              Bank Slip Image
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition">
              <Input
                id="slip"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="slip"
                className="cursor-pointer block space-y-2"
              >
                <div className="text-3xl">📄</div>
                <div>
                  <p className="font-semibold text-foreground">
                    {file ? file.name : 'Click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/20 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('info')
                setFile(null)
                setError('')
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading || !file}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? 'Uploading...' : 'Submit'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
