"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useToast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { PageLoading } from "@/components/shared/loading"
import { EmptyState } from "@/components/shared/empty-state"
import { CreatableSelect } from "@/components/shared/creatable-select"
import { cn, calculateGrade } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calculator,
  ShieldCheck,
  Save,
  Printer,
  AlertCircle,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
}

interface ClassItem {
  id: string
  name: string
}

interface SubjectItem {
  id: string
  name: string
  code: string
}

interface ExamResultItem {
  id?: string
  examId: string
  studentId: string
  classId: string
  subjectId: string
  test1: number
  test2: number
  assignment: number
  examination: number
  total: number
  grade: string
  position: number | null
  remarks: string
  isApproved: boolean
  student?: Student
}

interface ExamData {
  id: string
  title: string
  term: string
  academicYear: string
  isPublished: boolean
}

export default function ExamResultsPage() {
  const params = useParams()
  const examId = params.id as string
  const { toast } = useToast()

  const [exam, setExam] = useState<ExamData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [results, setResults] = useState<ExamResultItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maxScores, setMaxScores] = useState({ test1: 10, test2: 10, assignment: 10, examination: 70 })
  const [gradeScale, setGradeScale] = useState<{ grade: string; minPercent: number; maxPercent: number }[] | undefined>()

  useEffect(() => {
    fetch("/api/settings").then(async (res) => {
      if (!res.ok) return
      const data: { key: string; value: string }[] = await res.json()
      const map = new Map(data.map((s) => [s.key, s.value]))
      setMaxScores({
        test1: parseInt(map.get("exam.test1Max") ?? "10"),
        test2: parseInt(map.get("exam.test2Max") ?? "10"),
        assignment: parseInt(map.get("exam.assignmentMax") ?? "10"),
        examination: parseInt(map.get("exam.examinationMax") ?? "70"),
      })
      const scaleRaw = map.get("grading_scale")
      if (scaleRaw) {
        try { setGradeScale(JSON.parse(scaleRaw)) } catch { /* use default */ }
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        setLoading(true)
        setError(null)
        const [examRes, classesRes, subjectsRes, studentsRes] = await Promise.all([
          fetch(`/api/exams/${examId}`),
          fetch("/api/classes"),
          fetch("/api/subjects"),
          fetch("/api/students"),
        ])
        if (cancelled) return

        if (!examRes.ok) throw new Error("Failed to load exam")
        const examJson = await examRes.json()
        setExam(examJson.exam ?? examJson.data ?? examJson)

        const classesJson = await classesRes.json()
        const cls = classesJson.classes ?? classesJson.data ?? classesJson
        setClasses(Array.isArray(cls) ? cls : [])

        const subjectsJson = await subjectsRes.json()
        const subs = subjectsJson.subjects ?? subjectsJson.data ?? subjectsJson
        setSubjects(Array.isArray(subs) ? subs : [])

        const studentsJson = await studentsRes.json()
        const studs = studentsJson.students ?? studentsJson.data ?? studentsJson
        setStudents(Array.isArray(studs) ? studs : [])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "An error occurred")
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [examId, toast])

  const resultsForSubject = () => {
    return results.filter((r) =>
      (!selectedClassId || r.classId === selectedClassId) &&
      (!selectedSubjectId || r.subjectId === selectedSubjectId)
    )
  }

  useEffect(() => {
    if (!selectedSubjectId) return
    const fetchResults = async () => {
      try {
        const [examRes, classStudentsRes] = await Promise.all([
          fetch(`/api/exams/${examId}`),
          selectedClassId ? fetch(`/api/students?classId=${selectedClassId}`) : Promise.resolve(null),
        ])
        if (!examRes.ok) throw new Error("Failed to fetch results")
        const json = await examRes.json()
        const allResults: ExamResultItem[] = json.results ?? []

        const classStudentList: Student[] = classStudentsRes?.ok ? await classStudentsRes.json() : []
        const studentIdsInClass = new Set(classStudentList.map((s) => s.id))

        const existingStudentIds = new Set(allResults.map((r) => r.studentId))
        for (const student of classStudentList) {
          if (!existingStudentIds.has(student.id)) {
            allResults.push({
              examId,
              studentId: student.id,
              classId: selectedClassId,
              subjectId: selectedSubjectId,
              test1: 0,
              test2: 0,
              assignment: 0,
              examination: 0,
              total: 0,
              grade: "",
              position: null,
              remarks: "",
              isApproved: false,
            })
          }
        }

        setResults(allResults)
      } catch {
        toast({ title: "Error", description: "Failed to load results", variant: "destructive" })
      }
    }
    fetchResults()
  }, [examId, selectedSubjectId, selectedClassId, toast])

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return "Unknown"
    return `${student.lastName} ${student.firstName}`
  }

  const getStudentAdmission = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.admissionNumber ?? "-"
  }

  const maxTotal = maxScores.test1 + maxScores.test2 + maxScores.assignment + maxScores.examination

  const handleScoreChange = (
    resultIndex: number,
    field: "test1" | "test2" | "assignment" | "examination" | "remarks",
    value: string
  ) => {
    setResults((prev) => {
      const filtered = prev.filter((r) =>
        (!selectedClassId || r.classId === selectedClassId) &&
        (!selectedSubjectId || r.subjectId === selectedSubjectId)
      )
      const next = [...prev]
      const globalIdx = prev.findIndex((r) => r.studentId === filtered[resultIndex]?.studentId && r.subjectId === filtered[resultIndex]?.subjectId)
      if (globalIdx === -1) return prev
      const r = { ...next[globalIdx] }

      if (field === "remarks") {
        r.remarks = value
      } else {
        const numVal = parseFloat(value)
        if (isNaN(numVal)) return prev
        const fieldMax = maxScores[field]
        if (numVal < 0 || numVal > fieldMax) return prev
        r[field] = numVal
        r.total = r.test1 + r.test2 + r.assignment + r.examination
        r.grade = calculateGrade(r.total, maxTotal, gradeScale)
      }

      next[globalIdx] = r
      return next
    })
  }

  const handleCalculateGrades = () => {
    setResults((prev) =>
      prev.map((r) => {
        const total = r.test1 + r.test2 + r.assignment + r.examination
        return {
          ...r,
          total,
          grade: calculateGrade(total, maxTotal, gradeScale),
        }
      })
    )
    toast({ title: "Success", description: "Grades calculated successfully" })
  }

  const handleSaveResults = async () => {
    const filtered = resultsForSubject()
    if (filtered.length === 0) return
    try {
      setSaving(true)
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: filtered.map(({ student, ...r }) => r) }),
      })
      if (!res.ok) throw new Error("Failed to save results")
      toast({ title: "Success", description: "Results saved successfully" })
      const json = await res.json()
      setResults(json.results ?? [])
    } catch {
      toast({ title: "Error", description: "Failed to save results", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleApproveResults = async () => {
    const filtered = resultsForSubject()
    if (filtered.length === 0) return
    try {
      setSaving(true)
      const approved = filtered.map(({ student, ...r }) => ({ ...r, isApproved: true }))
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: approved }),
      })
      if (!res.ok) throw new Error("Failed to approve results")
      toast({ title: "Success", description: "Results approved successfully" })
      const json = await res.json()
      setResults(json.results ?? [])
    } catch {
      toast({ title: "Error", description: "Failed to approve results", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <PageLoading />

  if (error && !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 bg-destructive/10 rounded-full">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/exams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exams
          </Link>
        </Button>
      </div>
    )
  }

  const filteredResults = resultsForSubject()
  const hasApproved = filteredResults.some((r) => r.isApproved)

  return (
    <div className="space-y-6">
      <PageHeader
        title={exam?.title ?? "Exam Results"}
        description={
          exam
            ? `${exam.term} — ${exam.academicYear}`
            : "Manage examination results"
        }
      >
        <Button variant="outline" asChild>
          <Link href="/exams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Class</Label>
              <CreatableSelect
                options={classes.map(c => ({ id: c.id, name: c.name }))}
                value={selectedClassId}
                onChange={setSelectedClassId}
                placeholder="All classes"
                onCreate={async (name) => {
                  const code = name.toUpperCase().replace(/\s+/g, "-").substring(0, 10)
                  const res = await fetch("/api/classes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, code, status: "Active" }),
                  })
                  if (!res.ok) { toast({ title: "Error", description: "Failed to create class", variant: "destructive" }); return null }
                  const created = await res.json()
                  setClasses(prev => [...prev, { id: created.id, name: created.name }])
                  toast({ title: "Success", description: `Class "${name}" created` })
                  return { id: created.id, name: created.name }
                }}
                className="w-52"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <CreatableSelect
                options={subjects.map(s => ({ id: s.id, name: s.name }))}
                value={selectedSubjectId}
                onChange={setSelectedSubjectId}
                placeholder="Select subject"
                onCreate={async (name) => {
                  const code = name.toUpperCase().replace(/\s+/g, "-").substring(0, 10)
                  const res = await fetch("/api/subjects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, code }),
                  })
                  if (!res.ok) { toast({ title: "Error", description: "Failed to create subject", variant: "destructive" }); return null }
                  const created = await res.json()
                  setSubjects(prev => [...prev, { id: created.id, name: created.name, code: created.code }])
                  toast({ title: "Success", description: `Subject "${name}" created` })
                  return { id: created.id, name: created.name }
                }}
                className="w-52"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCalculateGrades} disabled={filteredResults.length === 0}>
          <Calculator className="mr-2 h-4 w-4" />
          Calculate Grades
        </Button>
        <Button
          onClick={handleSaveResults}
          disabled={saving || filteredResults.length === 0}
          variant="default"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Results"}
        </Button>
        <Button
          onClick={handleApproveResults}
          disabled={saving || filteredResults.length === 0 || hasApproved}
          variant="secondary"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {saving ? "Approving..." : "Approve Results"}
        </Button>
        <Button variant="outline" onClick={handlePrint} disabled={filteredResults.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Print Results
        </Button>
      </div>

      {filteredResults.length === 0 && selectedSubjectId && (
        <EmptyState
          icon={FileSpreadsheet}
          title="No Results"
          description="Select a class and subject, then load results. If no results exist, they will appear here once saved."
        />
      )}

      {filteredResults.length === 0 && !selectedSubjectId && (
        <EmptyState
          icon={FileSpreadsheet}
          title="Select a Subject"
          description="Choose a subject above to view and manage exam results."
        />
      )}

      {filteredResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Results
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredResults.length} records)
                </span>
              </CardTitle>
              {hasApproved && (
                <Badge variant="default" className="bg-green-600">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Approved
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">S/N</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead className="w-20 text-center">Test 1 ({maxScores.test1})</TableHead>
                    <TableHead className="w-20 text-center">Test 2 ({maxScores.test2})</TableHead>
                    <TableHead className="w-24 text-center">Assignment ({maxScores.assignment})</TableHead>
                    <TableHead className="w-20 text-center">Exam ({maxScores.examination})</TableHead>
                    <TableHead className="w-16 text-center">Total</TableHead>
                    <TableHead className="w-14 text-center">Grade</TableHead>
                    <TableHead className="w-14 text-center">Pos</TableHead>
                    <TableHead className="w-40">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result, index) => (
                    <TableRow key={result.studentId + result.subjectId}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {getStudentName(result.studentId)}
                      </TableCell>
                      <TableCell>{getStudentAdmission(result.studentId)}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={maxScores.test1}
                          step={0.5}
                          value={result.test1}
                          onChange={(e) => handleScoreChange(index, "test1", e.target.value)}
                          className={cn("h-9 w-16 text-center mx-auto", result.isApproved && "bg-muted")}
                          disabled={result.isApproved}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={maxScores.test2}
                          step={0.5}
                          value={result.test2}
                          onChange={(e) => handleScoreChange(index, "test2", e.target.value)}
                          className={cn("h-9 w-16 text-center mx-auto", result.isApproved && "bg-muted")}
                          disabled={result.isApproved}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={maxScores.assignment}
                          step={0.5}
                          value={result.assignment}
                          onChange={(e) => handleScoreChange(index, "assignment", e.target.value)}
                          className={cn("h-9 w-20 text-center mx-auto", result.isApproved && "bg-muted")}
                          disabled={result.isApproved}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={maxScores.examination}
                          step={0.5}
                          value={result.examination}
                          onChange={(e) => handleScoreChange(index, "examination", e.target.value)}
                          className={cn("h-9 w-16 text-center mx-auto", result.isApproved && "bg-muted")}
                          disabled={result.isApproved}
                        />
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {result.total}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
                            result.grade === "A" && "bg-green-100 text-green-700",
                            result.grade === "B" && "bg-blue-100 text-blue-700",
                            result.grade === "C" && "bg-yellow-100 text-yellow-700",
                            result.grade === "D" && "bg-orange-100 text-orange-700",
                            result.grade === "E" && "bg-red-100 text-red-700",
                            result.grade === "F" && "bg-red-200 text-red-800"
                          )}
                        >
                          {result.grade || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {result.position ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Remarks..."
                          value={result.remarks ?? ""}
                          onChange={(e) => handleScoreChange(index, "remarks", e.target.value)}
                          className={cn("h-9", result.isApproved && "bg-muted")}
                          disabled={result.isApproved}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}