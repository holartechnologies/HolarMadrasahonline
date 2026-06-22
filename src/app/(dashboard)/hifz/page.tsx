"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import {
  BookOpen,
  Plus,
  Pencil,
  Users,
  Percent,
  Trophy,
} from "lucide-react"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { FormField } from "@/components/shared/form-field"
import { StatCard } from "@/components/shared/stat-card"
import { PageLoading } from "@/components/shared/loading"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { hifzRecordSchema } from "@/schemas"
import { useToast } from "@/components/ui/toaster"

type HifzRecord = {
  id: string
  studentId: string
  classId: string
  currentJuz: number
  currentSurah: number
  sabak: string | null
  sabqi: string | null
  manzil: string | null
  memorizationPercent: number
  teacherRemarks: string | null
  dateUpdated: string
  student: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
  }
  class: {
    id: string
    name: string
    code: string
  }
}

type Student = {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  class?: { id: string; name: string; code: string } | null
}

const formSchema = hifzRecordSchema.extend({
  currentJuz: z.coerce.number().min(1).max(30),
  currentSurah: z.coerce.number().min(1).max(114),
  memorizationPercent: z.coerce.number().min(0).max(100),
})

type FormData = z.infer<typeof formSchema>

function MemorizationBar({ value }: { value: number }) {
  const color =
    value >= 75 ? "from-green-500 to-emerald-400" :
    value >= 50 ? "from-yellow-500 to-amber-400" :
    value >= 25 ? "from-orange-500 to-amber-400" :
    "from-red-500 to-rose-400"

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-10 text-right">{value}%</span>
    </div>
  )
}

export default function HifzPage() {
  const [records, setRecords] = useState<HifzRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HifzRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      classId: "",
      currentJuz: 1,
      currentSurah: 1,
      sabak: "",
      sabqi: "",
      manzil: "",
      memorizationPercent: 0,
      teacherRemarks: "",
    },
  })

  const watchedStudentId = form.watch("studentId")

  async function fetchData() {
    try {
      setLoading(true)
      const [recordsRes, studentsRes] = await Promise.all([
        fetch("/api/hifz"),
        fetch("/api/students"),
      ])
      if (!recordsRes.ok) throw new Error("Failed to fetch hifz records")
      if (!studentsRes.ok) throw new Error("Failed to fetch students")
      const [recordsData, studentsData] = await Promise.all([
        recordsRes.json(),
        studentsRes.json(),
      ])
      setRecords(recordsData)
      setStudents(studentsData)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (watchedStudentId) {
      const student = students.find((s) => s.id === watchedStudentId)
      if (student?.class) {
        form.setValue("classId", student.class.id)
      }
    }
  }, [watchedStudentId, students, form])

  function openAddDialog() {
    setEditingRecord(null)
    form.reset({
      studentId: "",
      classId: "",
      currentJuz: 1,
      currentSurah: 1,
      sabak: "",
      sabqi: "",
      manzil: "",
      memorizationPercent: 0,
      teacherRemarks: "",
    })
    setDialogOpen(true)
  }

  function openEditDialog(record: HifzRecord) {
    setEditingRecord(record)
    form.reset({
      studentId: record.studentId,
      classId: record.classId,
      currentJuz: record.currentJuz,
      currentSurah: record.currentSurah,
      sabak: record.sabak || "",
      sabqi: record.sabqi || "",
      manzil: record.manzil || "",
      memorizationPercent: record.memorizationPercent,
      teacherRemarks: record.teacherRemarks || "",
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: FormData) {
    try {
      setSubmitting(true)
      const url = editingRecord
        ? `/api/hifz?id=${editingRecord.id}`
        : "/api/hifz"
      const method = editingRecord ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save record")
      }

      toast({
        title: "Success",
        description: editingRecord
          ? "Hifz record updated successfully"
          : "Hifz record created successfully",
      })

      setDialogOpen(false)
      fetchData()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const avgMemorization =
    records.length > 0
      ? Math.round(
          records.reduce((sum, r) => sum + r.memorizationPercent, 0) /
            records.length
        )
      : 0

  const aboveFifty = records.filter((r) => r.memorizationPercent > 50).length

  const columns: ColumnDef<HifzRecord>[] = [
    {
      accessorKey: "student",
      header: "Student Name",
      cell: ({ row }) => {
        const s = row.original.student
        return (
          <div>
            <p className="font-medium">{s.firstName} {s.lastName}</p>
            <p className="text-xs text-muted-foreground">{s.admissionNumber}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "class",
      header: "Class",
      cell: ({ row }) => row.original.class?.name ?? "-",
    },
    {
      accessorKey: "currentJuz",
      header: "Current Juz",
    },
    {
      accessorKey: "currentSurah",
      header: "Current Surah",
    },
    {
      header: "Sabak / Sabqi / Manzil",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="text-xs space-y-0.5">
            <p><span className="text-muted-foreground">S:</span> {r.sabak || "-"}</p>
            <p><span className="text-muted-foreground">SQ:</span> {r.sabqi || "-"}</p>
            <p><span className="text-muted-foreground">M:</span> {r.manzil || "-"}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "memorizationPercent",
      header: "Memorization %",
      cell: ({ row }) => <MemorizationBar value={row.original.memorizationPercent} />,
    },
    {
      accessorKey: "dateUpdated",
      header: "Last Updated",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.dateUpdated), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openEditDialog(row.original)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hifz Tracking"
        description="Monitor students' Quran memorization progress"
      >
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Record
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Students in Hifz"
          value={records.length}
          icon={Users}
        />
        <StatCard
          title="Average Memorization"
          value={`${avgMemorization}%`}
          icon={Percent}
        />
        <StatCard
          title="Students >50% Memorization"
          value={aboveFifty}
          icon={Trophy}
          description={`Out of ${records.length} students`}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Hifz Records Yet"
          description="Start tracking Quran memorization by adding your first hifz record."
          actionLabel="Add Record"
          onAction={openAddDialog}
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={records}
              searchKey="student"
              searchPlaceholder="Search by student name or class..."
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "Edit Hifz Record" : "Add Hifz Record"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Student" required error={form.formState.errors.studentId?.message}>
              <Select
                value={form.watch("studentId")}
                onValueChange={(v) => form.setValue("studentId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Class" required error={form.formState.errors.classId?.message}>
              <Input value={students.find((s) => s.id === watchedStudentId)?.class?.name ?? ""} disabled />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Current Juz (1-30)" required error={form.formState.errors.currentJuz?.message}>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  {...form.register("currentJuz", { valueAsNumber: true })}
                />
              </FormField>
              <FormField label="Current Surah (1-114)" required error={form.formState.errors.currentSurah?.message}>
                <Input
                  type="number"
                  min={1}
                  max={114}
                  {...form.register("currentSurah", { valueAsNumber: true })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Sabak" error={form.formState.errors.sabak?.message}>
                <Input {...form.register("sabak")} placeholder="e.g. 1-5" />
              </FormField>
              <FormField label="Sabqi" error={form.formState.errors.sabqi?.message}>
                <Input {...form.register("sabqi")} placeholder="e.g. 6-10" />
              </FormField>
              <FormField label="Manzil" error={form.formState.errors.manzil?.message}>
                <Input {...form.register("manzil")} placeholder="e.g. 11-15" />
              </FormField>
            </div>

            <FormField label="Memorization %" required error={form.formState.errors.memorizationPercent?.message}>
              <Input
                type="number"
                min={0}
                max={100}
                {...form.register("memorizationPercent", { valueAsNumber: true })}
              />
            </FormField>

            <FormField label="Teacher Remarks" error={form.formState.errors.teacherRemarks?.message}>
              <Textarea {...form.register("teacherRemarks")} rows={3} />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingRecord ? "Update Record" : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
