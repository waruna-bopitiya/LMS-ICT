'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Award, TrendingUp, Calendar, BookOpen, AlertCircle } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface MarkRecord {
  id: string
  paper_name: string
  marks_obtained: number
  total_marks: number
  percentage: number
  rank: number
  total_participants: number
  created_at: string
}

export default function StudentMarksDashboard() {
  const [records, setRecords] = useState<MarkRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMarks() {
      try {
        const response = await fetch('/api/student/marks')
        if (response.ok) {
          const data = await response.json()
          setRecords(data.marks || [])
        }
      } catch (err) {
        console.error('Error fetching marks:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMarks()
  }, [])

  if (loading) {
    return (
      <Card className="bg-card/75 border-border shadow-md">
        <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading your exam marks and ranking...</p>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card className="bg-card/75 border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Paper Marks & Ranking
          </CardTitle>
          <CardDescription>
            Your scores and rank progression will appear here once graded by the teacher.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium">No marks entered yet.</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Once the admin updates your marks for Term Exams or Mock Papers, your percentage, ranks, and trend charts will instantly be visible here.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Find latest record
  const latestRecord = records[records.length - 1]

  // Calculate deviation from class average
  const getDeviationText = (userPct: number, avgPct: number) => {
    const diff = userPct - avgPct
    if (diff > 0) return `+${diff.toFixed(2)}%`
    if (diff < 0) return `${diff.toFixed(2)}%`
    return '0.00%'
  }

  // Formatter for Recharts X-Axis (shorten paper name if too long)
  const formatXAxis = (tickItem: string) => {
    if (tickItem.length > 12) {
      return tickItem.substring(0, 10) + '..'
    }
    return tickItem
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-card/75 border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Latest Exam Score
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  {latestRecord.marks_obtained} / {latestRecord.total_marks}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {latestRecord.paper_name}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/75 border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Percentage
                </p>
                <h3 className="text-2xl font-bold text-primary mt-2">
                  {latestRecord.percentage}%
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Normalized score out of 100
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/75 border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Current Rank
                </p>
                <h3 className="text-2xl font-bold text-amber-500 mt-2">
                  Rank {latestRecord.rank} <span className="text-xs font-normal text-muted-foreground">of {latestRecord.total_participants}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on class submissions
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/75 border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Class Comparison
                </p>
                <h3 className={`text-2xl font-bold mt-2 ${latestRecord.percentage >= latestRecord.class_average ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {latestRecord.percentage >= latestRecord.class_average ? '+' : ''}
                  {(latestRecord.percentage - latestRecord.class_average).toFixed(2)}%
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Class Average: {latestRecord.class_average}%
                </p>
              </div>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${latestRecord.percentage >= latestRecord.class_average ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: List and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table of marks */}
        <Card className="bg-card/75 border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Detailed Exam Performance
            </CardTitle>
            <CardDescription>
              Chronological log of your scores and rank classifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Paper / Exam Name</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Percentage</th>
                    <th className="px-4 py-3 text-center">Rank</th>
                    <th className="px-4 py-3 text-center">Class Average</th>
                    <th className="px-4 py-3 text-center">Deviation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {records.map((record) => {
                    const dev = record.percentage - record.class_average
                    return (
                      <tr key={record.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-foreground">
                          {record.paper_name}
                        </td>
                        <td className="px-4 py-3.5 text-center text-foreground font-semibold">
                          {record.marks_obtained} / {record.total_marks}
                        </td>
                        <td className="px-4 py-3.5 text-center text-primary font-bold">
                          {record.percentage}%
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 font-semibold text-primary">
                            {record.rank} / {record.total_participants}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-muted-foreground font-mono">
                          {record.class_average}%
                        </td>
                        <td className={`px-4 py-3.5 text-center font-bold font-mono ${dev >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {dev >= 0 ? '+' : ''}{dev.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recharts Performance Progression Chart */}
        <Card className="bg-card/75 border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Performance Trend
            </CardTitle>
            <CardDescription>
              Visual overview of your normalized percentage scores against the class average.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={records}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="paper_name"
                    tickFormatter={formatXAxis}
                    className="fill-muted-foreground text-[10px]"
                  />
                  <YAxis
                    domain={[0, 100]}
                    className="fill-muted-foreground text-[10px]"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--popover-foreground)',
                      fontSize: '11px',
                    }}
                    labelClassName="font-bold text-foreground mb-1"
                    formatter={(value: any, name: string, props: any) => {
                      if (name === 'percentage') {
                        return [
                          `${value}% (Rank: ${props.payload.rank} of ${props.payload.total_participants})`,
                          'Your Score'
                        ]
                      }
                      if (name === 'class_average') {
                        return [
                          `${value}%`,
                          'Class Average'
                        ]
                      }
                      return [value, name]
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPercentage)"
                    name="percentage"
                  />
                  <Area
                    type="monotone"
                    dataKey="class_average"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    fill="none"
                    strokeWidth={1.5}
                    name="class_average"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
