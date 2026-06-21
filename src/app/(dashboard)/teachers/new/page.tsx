"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { teacherSchema, type TeacherInput } from "@/schemas"
import { PageHeader } from "@/components/shared/page-header"
import { FormField } from "@/components/shared/form-field"
import { PageLoading } from "@/components/shared/loading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/toaster"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

interface ClassOption {
  id: string
  name: string
  code: string
}

interface SubjectOption {
  id: string
  name: string
  code: string
}

export default function NewTeacherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      staffId: "",
      fullName: "",
      phoneNumber: "",
      email: "",
      qualification: "",
      dateEmployed: new Date().toISOString().split("T")[0],
      classIds: [],
      subjectIds: [],
    },
  })

  const selectedSubjectIds = watch("subjectIds")
  const selectedClassIds = watch("classIds")

  useEffect(() => {
    async function fetchData() {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/subjects"),
        ])
        if (!classesRes.ok || !subjectsRes.ok) throw new Error("Failed to load form data")
        const classesData = await classesRes.json()
        const subjectsData = await subjectsRes.json()
        setClasses(classesData)
        setSubjects(subjectsData)
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load form data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  function toggleSubject(subjectId: string) {
    const current = selectedSubjectIds || []
    if (current.includes(subjectId)) {
      setValue("subjectIds", current.filter((id) => id !== subjectId))
    } else {
      setValue("subjectIds", [...current, subjectId])
    }
  }

  async function onSubmit(data: TeacherInput) {
    try {
      setSubmitting(true)
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to create teacher")
      }
      toast({ title: "Success", description: "Teacher created successfully" })
      router.push("/teachers")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create teacher",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageHeader title="Add Teacher" description="Register a new teacher or staff member">
        <Button variant="outline" asChild>
          <Link href="/teachers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField label="Staff ID" error={undefined}>
                <Input value="IHYSU/STF/---" disabled className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">Auto-generated on save</p>
              </FormField>

              <FormField label="Full Name" error={errors.fullName?.message} required>
                <Input {...register("fullName")} placeholder="Enter full name" />
              </FormField>

              <FormField label="Phone Number" error={errors.phoneNumber?.message} required>
                <Input {...register("phoneNumber")} placeholder="e.g. 07012345678" />
              </FormField>

              <FormField label="Email" error={errors.email?.message}>
                <Input {...register("email")} type="email" placeholder="email@example.com" />
              </FormField>

              <FormField label="Qualification" error={errors.qualification?.message}>
                <Input {...register("qualification")} placeholder="e.g. B.Ed, MSc" />
              </FormField>

              <FormField label="Date Employed" error={errors.dateEmployed?.message} required>
                <Input
                  {...register("dateEmployed", { valueAsDate: false })}
                  type="date"
                />
              </FormField>

              <FormField label="Assigned Classes" error={errors.classIds?.message}>
                <div className="flex flex-wrap gap-2 mt-1">
                  {classes.map((cls) => {
                    const isSelected = (selectedClassIds || []).includes(cls.id)
                    return (
                      <Button
                        key={cls.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = selectedClassIds || []
                          if (current.includes(cls.id)) {
                            setValue("classIds", current.filter((id) => id !== cls.id))
                          } else {
                            setValue("classIds", [...current, cls.id])
                          }
                        }}
                      >
                        {cls.name} ({cls.code})
                      </Button>
                    )
                  })}
                  {classes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No classes available</p>
                  )}
                </div>
              </FormField>
            </div>

            <FormField label="Assigned Subjects" error={errors.subjectIds?.message}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
                {subjects.map((subject) => {
                  const isSelected = (selectedSubjectIds || []).includes(subject.id)
                  return (
                    <Button
                      key={subject.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSubject(subject.id)}
                      className="justify-start"
                    >
                      {subject.name}
                    </Button>
                  )
                })}
              </div>
            </FormField>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Teacher
              </Button>
              <Button variant="outline" asChild>
                <Link href="/teachers">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
