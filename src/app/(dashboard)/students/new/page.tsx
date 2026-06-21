"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema, StudentInput } from "@/schemas"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { useToast } from "@/components/ui/toaster"

interface ClassOption {
  id: string
  name: string
  code: string
}

export default function NewStudentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      gender: "male",
      status: "Active",
    },
  })

  const gender = watch("gender")
  const status = watch("status")
  const classId = watch("classId")

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/classes")
        if (!res.ok) return
        const json = await res.json()
        setClasses(json)
      } catch {
        // silently fail
      }
    }
    fetchClasses()
  }, [])

  async function onSubmit(data: StudentInput) {
    try {
      setSubmitting(true)
      const body = { ...data, passportPhoto: photoBase64 }
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create student")
      }
      toast({ title: "Success", description: "Student created successfully" })
      router.push("/students")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create student",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 80 * 1024) {
        toast({ title: "Error", description: "Photo must be under 80KB", variant: "destructive" })
        e.target.value = ""
        return
      }
      setPhotoPreview(URL.createObjectURL(file))
      const reader = new FileReader()
      reader.onload = () => setPhotoBase64(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Student" description="Register a new student">
        <Button variant="outline" asChild>
          <Link href="/students">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Admission Number" error={undefined}>
                  <Input
                    value={`IHYSU/${new Date().getFullYear()}/---`}
                    disabled
                    className="text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated on save
                  </p>
                </FormField>
                <FormField label="Status" error={errors.status?.message}>
                  <Select
                    value={status}
                    onValueChange={(v) => setValue("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="First Name" error={errors.firstName?.message} required>
                  <Input {...register("firstName")} placeholder="First name" />
                </FormField>
                <FormField label="Last Name" error={errors.lastName?.message} required>
                  <Input {...register("lastName")} placeholder="Last name" />
                </FormField>
                <FormField label="Other Name" error={errors.otherName?.message}>
                  <Input {...register("otherName")} placeholder="Other name (optional)" />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Gender" error={errors.gender?.message} required>
                  <Select
                    value={gender}
                    onValueChange={(v) => setValue("gender", v as "male" | "female")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Date of Birth" error={errors.dateOfBirth?.message} required>
                  <Input type="date" {...register("dateOfBirth", { valueAsDate: false })} />
                </FormField>
                <FormField label="Class" error={errors.classId?.message}>
                  <Select
                    value={classId || ""}
                    onValueChange={(v) => setValue("classId", v || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Passport Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-xs text-muted-foreground">Photo Preview</p>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="text-xs"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Upload a passport photograph (visual preview only)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Parent / Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Parent Name" error={errors.parentName?.message} required>
                <Input {...register("parentName")} placeholder="Full name" />
              </FormField>
              <FormField label="Parent Phone" error={errors.parentPhone?.message} required>
                <Input {...register("parentPhone")} placeholder="Phone number" />
              </FormField>
              <FormField label="Parent Email" error={errors.parentEmail?.message}>
                <Input {...register("parentEmail")} type="email" placeholder="Email (optional)" />
              </FormField>
            </div>
            <FormField label="Address" error={errors.address?.message} required>
              <Textarea {...register("address")} placeholder="Home address" rows={3} />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 mt-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Student
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/students">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
