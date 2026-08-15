'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Landmark, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react'

const BANK_ACCOUNTS = [
  {
    bankName: 'Sampath Bank',
    accountName: 'B A W CHATHURANGA',
    accountNumber: '100352992821',
    branch: 'NUGEGODA',
    initials: 'SB',
    brandColor: 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/30',
  },
  {
    bankName: "People's Bank",
    accountName: 'B A W CHATHURANGA',
    accountNumber: '196200180015356',
    branch: 'KADUWELA',
    initials: 'PB',
    brandColor: 'bg-[#800000]/10 text-[#800000] border-[#800000]/30',
  },
  {
    bankName: 'Commercial Bank',
    accountName: 'B A W CHATHURANGA',
    accountNumber: '8001130498',
    branch: 'MATUGAMA',
    initials: 'CB',
    brandColor: 'bg-[#0056b3]/10 text-[#0056b3] border-[#0056b3]/30',
  },
  {
    bankName: 'Bank Of Ceylon (BOC)',
    accountName: 'B A W CHATHURANGA',
    accountNumber: '7728109',
    branch: 'Kalutara',
    initials: 'BOC',
    brandColor: 'bg-[#cca300]/10 text-[#cca300] border-[#cca300]/30',
  }
]

export default function EnrollmentForm({
  courseId,
  coursePrice,
}: {
  courseId: string
  coursePrice: number
}) {
  const router = useRouter()
  const [step, setStep] = useState<'choice' | 'info' | 'upload'>('choice')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => {
      setCopiedIndex(null)
    }, 2000)
  }

  // Mirrors the server allowlist in lib/supabase/admin.ts, so a file that will
  // be rejected is caught here instead of after a full upload.
  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  const MAX_BYTES = 15 * 1024 * 1024

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!ACCEPTED.includes(selectedFile.type)) {
        setError('Please upload a JPG, PNG, or PDF of your bank slip')
        return
      }
      if (selectedFile.size > MAX_BYTES) {
        setError('That file is larger than 15MB. Try a photo at a lower resolution.')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  // Handle Online Pay via PayHere
  const handleOnlinePay = async () => {
    setCheckoutLoading(true)
    setError('')
    try {
      const response = await fetch('/api/payments/payhere/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout')
      }

      // Redirect and callback URLs come from the server, so a tampered client
      // cannot redirect PayHere's server-to-server notification elsewhere.
      const { returnUrl, cancelUrl, notifyUrl } = data

      const payhereUrl = data.sandbox
        ? 'https://sandbox.payhere.lk/pay/checkout'
        : 'https://www.payhere.lk/pay/checkout'

      // Construct and submit PayHere HTML form programmatically
      const form = document.createElement('form')
      form.setAttribute('method', 'post')
      form.setAttribute('action', payhereUrl)

      const addInput = (name: string, value: string) => {
        const input = document.createElement('input')
        input.setAttribute('type', 'hidden')
        input.setAttribute('name', name)
        input.setAttribute('value', value)
        form.appendChild(input)
      }

      addInput('merchant_id', data.merchantId)
      addInput('return_url', returnUrl)
      addInput('cancel_url', cancelUrl)
      addInput('notify_url', notifyUrl)
      addInput('order_id', data.orderId)
      addInput('items', data.items)
      addInput('currency', data.currency)
      addInput('amount', data.amount)
      addInput('first_name', data.customer.firstName)
      addInput('last_name', data.customer.lastName)
      addInput('email', data.customer.email)
      addInput('phone', data.customer.phone)
      addInput('address', data.customer.address)
      addInput('city', data.customer.city)
      addInput('country', data.customer.country)
      addInput('custom_1', data.custom1)
      addInput('custom_2', data.custom2)
      addInput('hash', data.hash)

      document.body.appendChild(form)
      form.submit()
    } catch (err: any) {
      console.error('Online checkout error:', err)
      setError(err.message || 'Payment initiation failed. Please try again.')
      setCheckoutLoading(false)
    }
  }

  // Handle Manual Bank Slip Submit
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
      // No amount: the server reads it from the course record.
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)

      const response = await fetch('/api/payments/upload-slip', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload bank slip')
        setLoading(false)
        return
      }

      // Both payment routes end on the same confirmation screen, so the student
      // always sees an explicit outcome rather than being dropped somewhere.
      router.push(`/student/payment/return?payment=${data.paymentId}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {step === 'choice' && (
        <Card className="border-border bg-card/45 shadow-sm p-5 rounded-2xl relative overflow-hidden">
          <div className="space-y-4 text-center">
            <div>
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full inline-block mb-2">
                Unlock Class Syllabus
              </span>
              <h3 className="text-lg font-bold text-foreground">Choose Payment Method</h3>
              <p className="text-xs text-muted-foreground mt-1">Select how you want to activate your class access.</p>
            </div>

            <div className="border-t border-b border-border/60 py-4 flex items-center justify-between text-left">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">One-Time Fee</p>
                <p className="text-2xl font-bold text-foreground">Rs. {coursePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-[10px] bg-secondary border border-border px-2 py-1 rounded text-muted-foreground font-semibold">LKR Currency</span>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={handleOnlinePay}
                disabled={checkoutLoading}
                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-primary-foreground font-semibold h-12 rounded-xl shadow-lg shadow-primary/15 flex items-center justify-center gap-2 transition-transform duration-300 active:scale-98"
              >
                {checkoutLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                Pay Online (Instant Access)
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep('info')}
                disabled={checkoutLoading}
                className="w-full border-border text-foreground hover:bg-secondary/40 font-semibold h-12 rounded-xl flex items-center justify-center gap-2"
              >
                <Landmark className="h-5 w-5 text-muted-foreground" />
                Pay via Bank Transfer
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </Card>
      )}

      {step === 'info' && (
        <Card className="border-border bg-card/45 shadow-sm p-5 rounded-2xl">
          <div className="space-y-4">
            <div className="space-y-3.5">
              <p className="font-bold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                <Landmark className="h-4 w-4 text-primary" />
                Available Bank Accounts:
              </p>
              
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {BANK_ACCOUNTS.map((account, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border/80 bg-secondary/5 hover:bg-secondary/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center text-[10px] font-black h-6 w-8 rounded border ${account.brandColor}`}>
                          {account.initials}
                        </span>
                        <span className="font-bold text-foreground text-xs sm:text-sm">{account.bankName}</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground bg-secondary/50 border border-border px-1.5 py-0.5 rounded">
                        {account.branch}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>Account Name:</span>
                        <span className="font-semibold text-foreground text-right">{account.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Account Number:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground bg-secondary/80 border border-border/60 px-1.5 py-0.5 rounded">{account.accountNumber}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => handleCopy(account.accountNumber, idx)}
                            title="Copy Account Number"
                          >
                            {copiedIndex === idx ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transfer Rs. {coursePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} to any of the accounts above, then upload the deposit slip proof of payment.
              </p>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('choice')}
                  className="flex-1 border-border rounded-xl h-11"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('upload')}
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl h-11"
                >
                  Upload Slip
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 'upload' && (
        <Card className="border-border bg-card/45 shadow-sm p-5 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="slip" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Bank Slip Image
              </label>
              <div className="border-2 border-dashed border-border/80 rounded-xl p-6 text-center hover:border-primary/50 transition bg-secondary/5">
                <Input
                  id="slip"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="slip"
                  className="cursor-pointer block space-y-2"
                >
                  <div className="text-3xl">📄</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {file ? file.name : 'Click to upload slip'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">JPG, PNG, or PDF up to 15MB</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('info')
                  setFile(null)
                  setError('')
                }}
                className="flex-1 border-border rounded-xl h-11"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || !file}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl h-11"
              >
                {loading ? 'Uploading...' : 'Submit Deposit'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
