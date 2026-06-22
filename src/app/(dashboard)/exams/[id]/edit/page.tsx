"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { PageLoading } from "@/components/shared/loading"
import { FormField } from "@/components/shared/form-field"
import { examSchema, type ExamInput } from "@/schemas"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface AcademicYearOption {
  id: string
  gregorianStart: number
  gregorianEnd: number
  hijriStart: number
  hijriEnd: number
}

const TERMS = [
  { value: "1st Term", label: "1st Term" },
  { value: "2nd Term", label: "2nd Term" },
  { value: "3rd Term", label: "3rd Term" },
]

export default function EditExamPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExamInput>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      term: "",
      academicYear: "",
      startDate: "",
      endDate: "",
    },
  })

  useEffect(() => {
    async function load() {
      try {
        const [examRes, yearsRes] = await Promise.all([
          fetch(`/api/exams/${params.id}`),
          fetch("/api/academic-years"),
        ])
        if (!examRes.ok) throw new Error("Failed to load exam")
        const exam = await examRes.json()
        reset({
          title: exam.title ?? "",
          term: exam.term ?? "",
          academicYear: exam.academicYear ?? "",
          startDate: exam.startDate ? exam.startDate.split("T")[0] : "",
          endDate: exam.endDate ? exam.endDate.split("T")[0] : "",
        })
        if (yearsRes.ok) {
          setAcademicYears(await yearsRes.json())
        }
      } catch {
        toast({ title: "Error", description: "Failed to load exam", variant: "destructive" })
        router.push("/exams")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, reset, toast, router])

  const onSubmit = async (data: ExamInput) => {
    try {
      setSubmitting(true)
      const res = await fetch(`/api/exams/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || "Failed to update exam")
      }
      toast({ title: "Success", description: "Exam updated successfully" })
      router.push("/exams")
      router.refresh()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update exam",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Exam" description="Update examination details">
        <Button variant="outline" asChild>
          <Link href="/exams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField label="Exam Title" required error={errors.title?.message}>
              <Input placeholder="e.g. First Term Examination" {...register("title")} />
            </FormField>

            <FormField label="Term" required error={errors.term?.message}>
              <Select value={watch("term")} onValueChange={(v) => setValue("term", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Academic Year" required error={errors.academicYear?.message}>
              <Select value={watch("academicYear")} onValueChange={(v) => setValue("academicYear", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => {
                    const label = `${y.gregorianStart}/${y.gregorianEnd} — ${y.hijriStart}/${y.hijriEnd}`
                    return (
                      <SelectItem key={y.id} value={label}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" required error={errors.startDate?.message}>
                <Input type="date" {...register("startDate")} />
              </FormField>
              <FormField label="End Date" required error={errors.endDate?.message}>
                <Input type="date" {...register("endDate")} />
              </FormField>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/exams">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
