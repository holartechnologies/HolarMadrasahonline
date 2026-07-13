"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreatableSelect } from "@/components/shared/creatable-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { PageLoading } from "@/components/shared/loading"
import { EmptyState } from "@/components/shared/empty-state"
import { cn, formatDate } from "@/lib/utils"
import { CalendarCheck, Save, RefreshCw, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react"

interface ClassItem {
  id: string
  name: string
  code: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  otherName: string | null
  admissionNumber: string
}

interface AttendanceRecord {
  id?: string
  studentId: string
  status: string
  remarks: string
}

interface StudentAttendance extends Student {
  attendance: AttendanceRecord | null
}

interface SavedAttendance {
  id: string
  student: { firstName: string; lastName: string; admissionNumber: string }
  status: string
  remarks: string | null
  date: string
}

const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Excused"] as const

export default function AttendancePage() {
  const { toast } = useToast()
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [classId, setClassId] = useState("")
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string; remarks: string }>>({})
  const [previousRecords, setPreviousRecords] = useState<SavedAttendance[]>([])
  const [prevLoading, setPrevLoading] = useState(false)
  const [showPrev, setShowPrev] = useState(false)
  const [prevDateFilter, setPrevDateFilter] = useState("")

  useEffect(() => {
    async function fetchClasses() {
      try {
        setClassesLoading(true)
        const res = await fetch("/api/classes")
        if (!res.ok) throw new Error("Failed to fetch classes")
        const json = await res.json()
        setClasses(Array.isArray(json) ? json : json.classes ?? [])
      } catch {
        toast({ title: "Error", description: "Failed to load classes", variant: "destructive" })
      } finally {
        setClassesLoading(false)
      }
    }
    fetchClasses()
  }, [toast])

  const loadAttendance = useCallback(async () => {
    if (!classId || !date) return
    try {
      setLoading(true)
      setError(null)
      const [studentsRes, attendanceRes] = await Promise.all([
        fetch(`/api/students?classId=${classId}`),
        fetch(`/api/attendance?classId=${classId}&date=${date}`),
      ])
      if (!studentsRes.ok) throw new Error("Failed to fetch students")
      const studentList: Student[] = await studentsRes.json()
      const attendanceRecords: AttendanceRecord[] = attendanceRes.ok ? await attendanceRes.json() : []
      const existingMap = new Map<string, { status: string; remarks: string }>()
      for (const rec of attendanceRecords) {
        existingMap.set(rec.studentId, { status: rec.status, remarks: rec.remarks ?? "" })
      }
      const merged: StudentAttendance[] = studentList.map((s) => {
        const att = existingMap.get(s.id) ?? null
        return { ...s, attendance: att ? { studentId: s.id, status: att.status, remarks: att.remarks } : null }
      })
      setStudents(merged)
      const dataMap: Record<string, { status: string; remarks: string }> = {}
      for (const s of merged) {
        dataMap[s.id] = {
          status: s.attendance?.status ?? "Present",
          remarks: s.attendance?.remarks ?? "",
        }
      }
      setAttendanceData(dataMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({ title: "Error", description: "Failed to load attendance", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [classId, date, toast])

  const loadPreviousRecords = useCallback(async () => {
    if (!classId) return
    try {
      setPrevLoading(true)
      const params = new URLSearchParams({ classId })
      if (prevDateFilter) params.set("date", prevDateFilter)
      const res = await fetch(`/api/attendance?${params}`)
      if (!res.ok) throw new Error("Failed to fetch history")
      const json = await res.json()
      setPreviousRecords(json.records ?? json ?? [])
    } catch {
      toast({ title: "Error", description: "Failed to load previous records", variant: "destructive" })
    } finally {
      setPrevLoading(false)
    }
  }, [classId, prevDateFilter, toast])

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }))
  }

  const handleSave = async () => {
    if (!classId || !date) return
    try {
      setSaving(true)
      const records = Object.entries(attendanceData).map(([studentId, data]) => ({
        studentId,
        classId,
        date,
        status: data.status,
        remarks: data.remarks || undefined,
      }))
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error("Failed to save attendance")
      toast({ title: "Success", description: "Attendance saved successfully" })
      await loadAttendance()
    } catch {
      toast({ title: "Error", description: "Failed to save attendance", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (classesLoading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Management" description="Record and manage student attendance">
        <Button onClick={handleSave} disabled={saving || students.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Class</Label>
              <CreatableSelect
                options={classes.map(c => ({ id: c.id, name: c.name }))}
                value={classId}
                onChange={setClassId}
                placeholder="Select a class"
                onCreate={async (name) => {
                  const code = name.toUpperCase().replace(/\s+/g, "-").substring(0, 10)
                  const res = await fetch("/api/classes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, code, status: "Active" }),
                  })
                  if (!res.ok) { toast({ title: "Error", description: "Failed to create class", variant: "destructive" }); return null }
                  const created = await res.json()
                  setClasses(prev => [...prev, { id: created.id, name: created.name, code: created.code }])
                  toast({ title: "Success", description: `Class "${name}" created` })
                  return { id: created.id, name: created.name }
                }}
                className="w-56"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
            </div>
            <Button onClick={loadAttendance} disabled={!classId || loading}>
              <CalendarCheck className="mr-2 h-4 w-4" />
              Take Attendance
            </Button>
            {students.length > 0 && (
              <Button variant="outline" onClick={loadAttendance} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && <PageLoading />}

      {!loading && students.length === 0 && classId && (
        <EmptyState
          icon={CalendarCheck}
          title="No Students"
          description="No students found in this class. Select a different class or date."
        />
      )}

      {!loading && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Attendance for {format(new Date(date), "dd MMMM yyyy")}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({students.length} students)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S/N</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="w-56">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {student.lastName} {student.firstName}
                        {student.otherName ? ` ${student.otherName}` : ""}
                      </TableCell>
                      <TableCell>{student.admissionNumber}</TableCell>
                      <TableCell>
                        <Select
                          value={attendanceData[student.id]?.status ?? "Present"}
                          onValueChange={(v) => handleStatusChange(student.id, v)}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-36",
                              attendanceData[student.id]?.status === "Present" && "border-green-500 text-green-600",
                              attendanceData[student.id]?.status === "Absent" && "border-red-500 text-red-600",
                              attendanceData[student.id]?.status === "Late" && "border-yellow-500 text-yellow-600",
                              attendanceData[student.id]?.status === "Excused" && "border-blue-500 text-blue-600"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ATTENDANCE_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Optional remarks..."
                          value={attendanceData[student.id]?.remarks ?? ""}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="h-9"
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

      <Card>
        <CardHeader>
          <button
            onClick={() => { setShowPrev(!showPrev); if (!showPrev) loadPreviousRecords() }}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Previous Attendance Records
            </CardTitle>
            {showPrev ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </CardHeader>
        {showPrev && (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={prevDateFilter}
                  onChange={(e) => setPrevDateFilter(e.target.value)}
                  className="w-44"
                  placeholder="Filter by date"
                />
              </div>
              <Button variant="outline" size="sm" onClick={loadPreviousRecords} disabled={prevLoading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", prevLoading && "animate-spin")} />
                Load
              </Button>
            </div>
            {prevLoading ? (
              <PageLoading />
            ) : previousRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No previous records found.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previousRecords.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{formatDate(rec.date)}</TableCell>
                        <TableCell className="font-medium">
                          {rec.student.lastName} {rec.student.firstName}
                        </TableCell>
                        <TableCell>{rec.student.admissionNumber}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                              rec.status === "Present" && "bg-green-100 text-green-700",
                              rec.status === "Absent" && "bg-red-100 text-red-700",
                              rec.status === "Late" && "bg-yellow-100 text-yellow-700",
                              rec.status === "Excused" && "bg-blue-100 text-blue-700"
                            )}
                          >
                            {rec.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{rec.remarks || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
