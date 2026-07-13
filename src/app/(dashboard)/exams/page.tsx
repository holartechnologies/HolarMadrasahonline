"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { PageLoading } from "@/components/shared/loading"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Trash2, ToggleLeft, ToggleRight, FileText, Pencil, ClipboardEdit } from "lucide-react"

interface Exam {
  id: string
  title: string
  term: string
  academicYear: string
  startDate: string
  endDate: string
  isPublished: boolean
}

export default function ExamsPage() {
  const { toast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchExams() {
      try {
        setLoading(true)
        const res = await fetch("/api/exams")
        if (!res.ok) throw new Error("Failed to fetch exams")
        const json = await res.json()
        if (cancelled) return
        setExams(json.exams ?? json.data ?? json ?? [])
      } catch {
        if (cancelled) return
        toast({ title: "Error", description: "Failed to load exams", variant: "destructive" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchExams()
    return () => { cancelled = true }
  }, [toast])

  const handleTogglePublish = async (exam: Exam) => {
    setPublishingId(exam.id)
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !exam.isPublished }),
      })
      if (!res.ok) throw new Error("Failed to toggle publish status")
      toast({ title: "Success", description: `Exam ${exam.isPublished ? "unpublished" : "published"}` })
      setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, isPublished: !e.isPublished } : e)))
    } catch {
      toast({ title: "Error", description: "Failed to toggle publish status", variant: "destructive" })
    } finally {
      setPublishingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/exams/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete exam")
      toast({ title: "Success", description: "Exam deleted successfully" })
      setExams((prev) => prev.filter((e) => e.id !== deleteId))
    } catch {
      toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" })
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  const columns: ColumnDef<Exam>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("title")}</span>
      ),
    },
    {
      accessorKey: "term",
      header: "Term",
    },
    {
      accessorKey: "academicYear",
      header: "Academic Year",
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => formatDate(row.getValue("startDate")),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => formatDate(row.getValue("endDate")),
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isPublished") ? "default" : "secondary"}>
          {row.getValue("isPublished") ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const exam = row.original
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild title="Record Scores">
              <Link href={`/exams/${exam.id}`}>
                <ClipboardEdit className="mr-1 h-4 w-4" />
                Scores
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild title="Edit Exam">
              <Link href={`/exams/${exam.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" disabled={publishingId === exam.id} onClick={() => handleTogglePublish(exam)}>
              {publishingId === exam.id ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : exam.isPublished ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(exam.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageHeader title="Exams" description="Manage examinations and results">
        <Button asChild>
          <Link href="/exams/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Link>
        </Button>
      </PageHeader>

      {exams.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Exams"
          description="No examinations have been created yet. Click 'Create Exam' to add one."
          actionLabel="Create Exam"
          actionHref="/exams/new"
        />
      ) : (
        <DataTable
          columns={columns}
          data={exams}
          searchKey="title"
          searchPlaceholder="Search exams..."
        />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Exam"
        description="Are you sure you want to delete this exam? This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}