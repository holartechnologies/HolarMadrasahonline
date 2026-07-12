"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { PageLoading } from "@/components/shared/loading"
import { DataTable } from "@/components/shared/data-table"
import { cn, formatDate, calculateGrade } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  DollarSign,
  FileSpreadsheet,
  BookCopy,
  Star,
  UserCircle,
  BarChart3,
  Printer,
  Download,
  FileText,
  X,
  AlertCircle,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

// ─── Report Type Definition ────────────────────────────────────────────────
interface ReportType {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
}

const reportTypes: ReportType[] = [
  { id: "student-list", title: "Student List", description: "All students with class info", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
  { id: "teacher-list", title: "Teacher List", description: "All teachers with assignments", icon: GraduationCap, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/20" },
  { id: "class-list", title: "Class List", description: "All classes with teachers and student count", icon: BookOpen, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
  { id: "attendance", title: "Attendance Report", description: "Attendance by date range", icon: ClipboardCheck, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/20" },
  { id: "fee", title: "Fee Report", description: "Fee collection summary", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
  { id: "examination", title: "Examination Results", description: "Results by exam, class, subject", icon: FileSpreadsheet, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/20" },
  { id: "hifz", title: "Hifz Report", description: "Hifz progress summary", icon: BookCopy, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/20" },
  { id: "character", title: "Character Assessment Report", description: "Character ratings summary", icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/20" },
  { id: "student-profile", title: "Student Profile", description: "Individual student report", icon: UserCircle, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/20" },
  { id: "class-summary", title: "Class Summary", description: "Class performance overview", icon: BarChart3, color: "text-rose-600", bgColor: "bg-rose-100 dark:bg-rose-900/20" },
]

// ─── Data Interfaces ───────────────────────────────────────────────────────
interface StudentData {
  id: string; admissionNumber: string; firstName: string; lastName: string; gender: string; parentName: string; parentPhone: string; parentEmail: string | null; address: string; dateOfBirth: string; status: string
  class: { id: string; name: string; code: string } | null
}

interface TeacherData {
  id: string; staffId: string; fullName: string; phoneNumber: string; email: string | null; qualification: string | null; dateEmployed: string
  classes: { id: string; name: string; code: string }[]
  subjects: { subject: { id: string; name: string; code: string } }[]
}

interface ClassData {
  id: string; name: string; code: string; status: string
  teacher: { id: string; staffId: string; fullName: string } | null
  _count: { students: number }
  subjects: { subject: { id: string; name: string; code: string } }[]
}

interface AttendanceData {
  id: string; date: string; status: string; remarks: string | null
  student: { id: string; firstName: string; lastName: string; admissionNumber: string }
  class: { id: string; name: string; code: string } | null
}

interface PaymentData {
  id: string; receiptNumber: string; amount: number; amountPaid: number; balance: number; paymentMethod: string; paymentDate: string; notes: string | null
  student: { id: string; firstName: string; lastName: string; admissionNumber: string } | null
  fee: { id: string; name: string; amount: number } | null
}

interface ExamOption {
  id: string; title: string; term: string; academicYear: string
}

interface ExamResultData {
  id: string; test1: number; test2: number; assignment: number; examination: number; total: number; grade: string; position: number | null; remarks: string | null; isApproved: boolean
  student: { id: string; firstName: string; lastName: string; admissionNumber: string }
  subject: { id: string; name: string; code: string }
}

interface HifzData {
  id: string; currentJuz: number; currentSurah: number; memorizationPercent: number | null; sabak: string | null; sabqi: string | null; manzil: string | null; teacherRemarks: string | null
  student: { id: string; firstName: string; lastName: string; admissionNumber: string }
  class: { id: string; name: string; code: string } | null
}

interface CharacterData {
  id: string; discipline: string; punctuality: string; respect: string; akhlaq: string; leadership: string; cleanliness: string; teacherRemarks: string | null
  student: { id: string; firstName: string; lastName: string; admissionNumber: string }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n")
  downloadBlob(csv, filename, "text/csv")
}

async function exportPDF(title: string, head: string[][], body: string[][], filename: string) {
  const jsPDF = (await import("jspdf")).default
  const autoTable = (await import("jspdf-autotable")).default
  const doc = new jsPDF()
  doc.setFontSize(16); doc.text(title, 14, 20)
  doc.setFontSize(10); doc.text(`Holartech MadrasahPro - Generated ${new Date().toLocaleDateString()}`, 14, 28)
  autoTable(doc, { startY: 35, head, body, styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } })
  doc.save(filename)
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  // Shared filter state
  const [classes, setClasses] = useState<{ id: string; name: string; code: string }[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([])
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([])

  // Student List
  const [students, setStudents] = useState<StudentData[]>([])
  const [studentClassFilter, setStudentClassFilter] = useState("")

  // Teacher List
  const [teacherData, setTeacherData] = useState<TeacherData[]>([])

  // Class List
  const [classData, setClassData] = useState<ClassData[]>([])

  // Attendance
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceClassFilter, setAttendanceClassFilter] = useState("")

  // Fee Report
  const [paymentData, setPaymentData] = useState<PaymentData[]>([])

  // Examination
  const [exams, setExams] = useState<ExamOption[]>([])
  const [selectedExamId, setSelectedExamId] = useState("")
  const [selectedExamClassId, setSelectedExamClassId] = useState("")
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState("")
  const [examResults, setExamResults] = useState<ExamResultData[]>([])

  // Hifz
  const [hifzData, setHifzData] = useState<HifzData[]>([])
  const [hifzClassFilter, setHifzClassFilter] = useState("")

  // Character
  const [characterData, setCharacterData] = useState<CharacterData[]>([])
  const [charClassFilter, setCharClassFilter] = useState("")

  // Student Profile
  const [allStudents, setAllStudents] = useState<{ id: string; firstName: string; lastName: string; admissionNumber: string }[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [studentProfile, setStudentProfile] = useState<any>(null)

  // Class Summary
  const [summaryClassFilter, setSummaryClassFilter] = useState("")
  const [summaryData, setSummaryData] = useState<any>(null)

  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        const [classesRes, subjectsRes, teachersRes, studentsRes] = await Promise.all([
          fetch("/api/classes"), fetch("/api/subjects"), fetch("/api/teachers"), fetch("/api/students"),
        ])
        if (classesRes.ok) { const d = await classesRes.json(); setClasses(d.classes ?? d.data ?? d) }
        if (subjectsRes.ok) { const d = await subjectsRes.json(); setSubjects(d.subjects ?? d.data ?? d) }
        if (teachersRes.ok) { const d = await teachersRes.json(); setTeachers(d) }
        if (studentsRes.ok) { const d = await studentsRes.json(); setStudents(d) }
      } catch { setError("Failed to load reference data") } finally { setLoading(false) }
    }
    init()
  }, [])

  // ─── Fetch functions per report ─────────────────────────────────────────
  const fetchStudentList = useCallback(async (classId: string) => {
    const url = classId ? `/api/students?classId=${classId}` : "/api/students"
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch students")
    return res.json() as Promise<StudentData[]>
  }, [])

  const fetchTeachers = useCallback(async () => {
    const res = await fetch("/api/teachers")
    if (!res.ok) throw new Error("Failed to fetch teachers")
    return res.json() as Promise<TeacherData[]>
  }, [])

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/classes")
    if (!res.ok) throw new Error("Failed to fetch classes")
    const d = await res.json()
    return (d.classes ?? d.data ?? d) as ClassData[]
  }, [])

  const fetchAttendance = useCallback(async (date: string, classId: string) => {
    const params = new URLSearchParams()
    if (date) params.set("date", date)
    if (classId) params.set("classId", classId)
    const res = await fetch(`/api/attendance?${params}`)
    if (!res.ok) throw new Error("Failed to fetch attendance")
    return res.json() as Promise<AttendanceData[]>
  }, [])

  const fetchPayments = useCallback(async () => {
    const res = await fetch("/api/payments")
    if (!res.ok) throw new Error("Failed to fetch payments")
    const d = await res.json()
    return (d.payments ?? d.data ?? d) as PaymentData[]
  }, [])

  const fetchExams = useCallback(async () => {
    const res = await fetch("/api/exams")
    if (!res.ok) throw new Error("Failed to fetch exams")
    const d = await res.json()
    return (d.exams ?? d.data ?? d) as ExamOption[]
  }, [])

  const fetchHifz = useCallback(async () => {
    const res = await fetch("/api/hifz")
    if (!res.ok) throw new Error("Failed to fetch hifz records")
    const d = await res.json()
    return (d.records ?? d.data ?? d) as HifzData[]
  }, [])

  const fetchCharacter = useCallback(async () => {
    const res = await fetch("/api/assessments")
    if (!res.ok) throw new Error("Failed to fetch assessments")
    const d = await res.json()
    return (d.assessments ?? d.data ?? d) as CharacterData[]
  }, [])

  // ─── Report generation handlers ─────────────────────────────────────────
  async function handleGenerateReport(report: ReportType) {
    setSelectedReport(report)
    setShowDialog(true)
    try {
      switch (report.id) {
        case "student-list": {
          const data = await fetchStudentList(studentClassFilter)
          setStudents(data)
          break
        }
        case "teacher-list": {
          setTeacherData(await fetchTeachers())
          break
        }
        case "class-list": {
          setClassData(await fetchClasses())
          break
        }
        case "attendance": {
          setAttendanceData(await fetchAttendance(attendanceDate, attendanceClassFilter))
          break
        }
        case "fee": {
          setPaymentData(await fetchPayments())
          break
        }
        case "examination": {
          setExams(await fetchExams())
          setExamResults([])
          setSelectedExamId("")
          setSelectedExamClassId("")
          setSelectedExamSubjectId("")
          break
        }
        case "hifz": {
          setHifzData(await fetchHifz())
          break
        }
        case "character": {
          setCharacterData(await fetchCharacter())
          break
        }
        case "student-profile": {
          const studs = await fetchStudentList("")
          setAllStudents(studs.map((s) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, admissionNumber: s.admissionNumber })))
          setSelectedStudentId("")
          setStudentProfile(null)
          break
        }
        case "class-summary": {
          setClassData(await fetchClasses())
          setSummaryClassFilter("")
          setSummaryData(null)
          break
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to load report data", variant: "destructive" })
    }
  }

  async function handleLoadExamResults() {
    if (!selectedExamId) return
    try {
      const res = await fetch(`/api/exams/${selectedExamId}`)
      if (!res.ok) throw new Error("Failed to load results")
      const json = await res.json()
      setExamResults(json.results ?? [])
    } catch {
      toast({ title: "Error", description: "Failed to load exam results", variant: "destructive" })
    }
  }

  async function handleLoadStudentProfile() {
    if (!selectedStudentId) return
    try {
      const student = students.find((s) => s.id === selectedStudentId)
      if (!student) return
      const [hifzRes, charRes, examsRes] = await Promise.all([
        fetch("/api/hifz"), fetch("/api/assessments"), fetch("/api/exams"),
      ])
      const hifzAll: HifzData[] = hifzRes.ok ? await hifzRes.json() : []
      const charAll: CharacterData[] = charRes.ok ? await charRes.json() : []
      const examsAll: ExamOption[] = examsRes.ok ? await examsRes.json() : []

      const hifz = hifzAll.find((h) => h.student.id === selectedStudentId) ?? null
      const charAssess = charAll.find((c) => c.student.id === selectedStudentId) ?? null

      const enrollments = students.filter((s) => s.id === selectedStudentId).map((s) => ({
        id: s.id, admissionNumber: s.admissionNumber, firstName: s.firstName, lastName: s.lastName,
        gender: s.gender, dateOfBirth: s.dateOfBirth, parentName: s.parentName, parentPhone: s.parentPhone,
        parentEmail: s.parentEmail, address: s.address, status: s.status, className: s.class?.name ?? "N/A",
      }))

      setStudentProfile({ student: enrollments[0], hifz, character: charAssess, exams: examsAll })
    } catch {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
    }
  }

  async function handleLoadClassSummary() {
    if (!summaryClassFilter) return
    try {
      const cls = classData.find((c) => c.id === summaryClassFilter)
      if (!cls) return
      const studs = await fetchStudentList(summaryClassFilter)
      const attendAll = await fetchAttendance("", summaryClassFilter)

      const attendanceRate = studs.length > 0
        ? Math.round((attendAll.filter((a) => a.status === "Present").length / Math.max(attendAll.length, 1)) * 100)
        : 0

      setSummaryData({ class: cls, students: studs, attendanceCount: attendAll.length, attendanceRate, totalStudents: studs.length })
    } catch {
      toast({ title: "Error", description: "Failed to load summary", variant: "destructive" })
    }
  }

  // ─── Export Handlers ─────────────────────────────────────────────────────
  function handlePrint() { window.print() }

  function handleExportCSV() {
    if (!selectedReport) return
    const id = selectedReport.id
    const filename = `${id}-report.csv`
    switch (id) {
      case "student-list": {
        const filtered = studentClassFilter ? students.filter((s) => s.class?.id === studentClassFilter) : students
        exportCSV(["Admission No", "First Name", "Last Name", "Gender", "Class", "Status", "Parent Name", "Parent Phone"],
          filtered.map((s) => [s.admissionNumber, s.firstName, s.lastName, s.gender, s.class?.name ?? "N/A", s.status, s.parentName, s.parentPhone]), filename)
        break
      }
      case "teacher-list":
        exportCSV(["Staff ID", "Full Name", "Phone", "Email", "Qualification", "Assigned Class"],
          teacherData.map((t) => [t.staffId, t.fullName, t.phoneNumber, t.email ?? "", t.qualification ?? "", t.classes.map((c) => c.name).join(", ")]), filename)
        break
      case "class-list":
        exportCSV(["Class Name", "Code", "Teacher", "Students", "Status"],
          classData.map((c) => [c.name, c.code, c.teacher?.fullName ?? "N/A", String(c._count.students), c.status]), filename)
        break
      case "attendance":
        exportCSV(["Date", "Student", "Admission No", "Class", "Status", "Remarks"],
          attendanceData.map((a) => [formatDate(a.date), `${a.student.lastName} ${a.student.firstName}`, a.student.admissionNumber, a.class?.name ?? "N/A", a.status, a.remarks ?? ""]), filename)
        break
      case "fee":
        exportCSV(["Receipt", "Student", "Admission No", "Fee Type", "Amount", "Paid", "Balance", "Method", "Date"],
          paymentData.map((p) => [p.receiptNumber, p.student ? `${p.student.lastName} ${p.student.firstName}` : "", p.student?.admissionNumber ?? "", p.fee?.name ?? "", String(p.amount), String(p.amountPaid), String(p.balance), p.paymentMethod, formatDate(p.paymentDate)]), filename)
        break
      case "examination":
        exportCSV(["Student", "Admission No", "Subject", "Test 1", "Test 2", "Assignment", "Exam", "Total", "Grade", "Position"],
          examResults.map((r) => [`${r.student.lastName} ${r.student.firstName}`, r.student.admissionNumber, r.subject.name, String(r.test1), String(r.test2), String(r.assignment), String(r.examination), String(r.total), r.grade, String(r.position ?? "")]), filename)
        break
      case "hifz":
        exportCSV(["Student", "Admission No", "Class", "Current Juz", "Current Surah", "Memorization %", "Sabak", "Sabqi"],
          hifzData.map((h) => [`${h.student.lastName} ${h.student.firstName}`, h.student.admissionNumber, h.class?.name ?? "N/A", String(h.currentJuz), String(h.currentSurah), String(h.memorizationPercent ?? 0), h.sabak ?? "", h.sabqi ?? ""]), filename)
        break
      case "character":
        exportCSV(["Student", "Admission No", "Discipline", "Punctuality", "Respect", "Akhlaq", "Leadership", "Cleanliness"],
          characterData.map((c) => [`${c.student.lastName} ${c.student.firstName}`, c.student.admissionNumber, c.discipline, c.punctuality, c.respect, c.akhlaq, c.leadership, c.cleanliness]), filename)
        break
    }
    toast({ title: "Exported", description: "CSV file downloaded" })
  }

  async function handleExportPDF() {
    if (!selectedReport) return
    toast({ title: "Exporting PDF", description: "Generating PDF report..." })
    try {
      const id = selectedReport.id
      const filename = `${id}-report.pdf`
      switch (id) {
        case "student-list": {
          const filtered = studentClassFilter ? students.filter((s) => s.class?.id === studentClassFilter) : students
          await exportPDF("Student List", [["Admission No", "Name", "Gender", "Class", "Status", "Parent Name"]],
            filtered.map((s) => [s.admissionNumber, `${s.firstName} ${s.lastName}`, s.gender, s.class?.name ?? "N/A", s.status, s.parentName]), filename)
          break
        }
        case "teacher-list":
          await exportPDF("Teacher List", [["Staff ID", "Name", "Phone", "Email", "Qualification", "Class"]],
            teacherData.map((t) => [t.staffId, t.fullName, t.phoneNumber, t.email ?? "", t.qualification ?? "", t.classes.map((c) => c.name).join(", ")]), filename)
          break
        case "class-list":
          await exportPDF("Class List", [["Class", "Code", "Teacher", "Students", "Status"]],
            classData.map((c) => [c.name, c.code, c.teacher?.fullName ?? "N/A", String(c._count.students), c.status]), filename)
          break
        case "attendance":
          await exportPDF("Attendance Report", [["Date", "Student", "Admission No", "Class", "Status"]],
            attendanceData.map((a) => [formatDate(a.date), `${a.student.lastName} ${a.student.firstName}`, a.student.admissionNumber, a.class?.name ?? "N/A", a.status]), filename)
          break
        case "fee":
          await exportPDF("Fee Report", [["Receipt", "Student", "Fee", "Amount", "Paid", "Balance"]],
            paymentData.map((p) => [p.receiptNumber, p.student ? `${p.student.lastName} ${p.student.firstName}` : "", p.fee?.name ?? "", String(p.amount), String(p.amountPaid), String(p.balance)]), filename)
          break
        case "examination":
          await exportPDF("Examination Results", [["Student", "Admission No", "Subject", "Test1", "Test2", "Assignment", "Exam", "Total", "Grade"]],
            examResults.map((r) => [`${r.student.lastName} ${r.student.firstName}`, r.student.admissionNumber, r.subject.name, String(r.test1), String(r.test2), String(r.assignment), String(r.examination), String(r.total), r.grade]), filename)
          break
        case "hifz":
          await exportPDF("Hifz Report", [["Student", "Admission No", "Juz", "Surah", "Memorization %", "Sabak", "Sabqi"]],
            hifzData.map((h) => [`${h.student.lastName} ${h.student.firstName}`, h.student.admissionNumber, String(h.currentJuz), String(h.currentSurah), String(h.memorizationPercent ?? 0), h.sabak ?? "", h.sabqi ?? ""]), filename)
          break
        case "character":
          await exportPDF("Character Assessment Report", [["Student", "Admission No", "Discipline", "Punctuality", "Respect", "Akhlaq", "Leadership", "Cleanliness"]],
            characterData.map((c) => [`${c.student.lastName} ${c.student.firstName}`, c.student.admissionNumber, c.discipline, c.punctuality, c.respect, c.akhlaq, c.leadership, c.cleanliness]), filename)
          break
      }
      toast({ title: "Success", description: "PDF file downloaded" })
    } catch { toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" }) }
  }

  // ─── Column Definitions ─────────────────────────────────────────────────
  const studentColumns: ColumnDef<StudentData>[] = [
    { accessorKey: "admissionNumber", header: "Admission No" },
    { id: "name", header: "Name", accessorFn: (r) => `${r.lastName} ${r.firstName}` },
    { accessorKey: "gender", header: "Gender" },
    { id: "class", header: "Class", accessorFn: (r) => r.class?.name ?? "N/A" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.getValue("status") === "Active" ? "default" : "secondary"}>{row.getValue("status") as string}</Badge> },
    { accessorKey: "parentName", header: "Parent" },
    { accessorKey: "parentPhone", header: "Phone" },
  ]

  const teacherColumns: ColumnDef<TeacherData>[] = [
    { accessorKey: "staffId", header: "Staff ID" },
    { accessorKey: "fullName", header: "Full Name" },
    { accessorKey: "phoneNumber", header: "Phone" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.getValue("email") || "-" },
    { accessorKey: "qualification", header: "Qualification", cell: ({ row }) => row.getValue("qualification") || "-" },
    { id: "class", header: "Assigned Class", accessorFn: (r) => r.classes.map((c) => c.name).join(", ") || "None" },
  ]

  const classColumns: ColumnDef<ClassData>[] = [
    { accessorKey: "name", header: "Class Name" },
    { accessorKey: "code", header: "Code" },
    { id: "teacher", header: "Teacher", accessorFn: (r) => r.teacher?.fullName ?? "Unassigned" },
    { id: "students", header: "Students", accessorFn: (r) => r._count.students },
    { accessorKey: "status", header: "Status" },
  ]

  const attendanceColumns: ColumnDef<AttendanceData>[] = [
    { id: "date", header: "Date", accessorFn: (r) => formatDate(r.date) },
    { id: "student", header: "Student", accessorFn: (r) => `${r.student.lastName} ${r.student.firstName}` },
    { id: "admission", header: "Admission", accessorFn: (r) => r.student.admissionNumber },
    { id: "class", header: "Class", accessorFn: (r) => r.class?.name ?? "N/A" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => {
      const s = row.getValue("status") as string
      return <Badge variant={s === "Present" ? "default" : s === "Late" ? "secondary" : "destructive"}>{s}</Badge>
    }},
  ]

  const paymentColumns: ColumnDef<PaymentData>[] = [
    { id: "student", header: "Student", accessorFn: (r) => r.student ? `${r.student.lastName} ${r.student.firstName}` : "" },
    { id: "admission", header: "Admission No", accessorFn: (r) => r.student?.admissionNumber ?? "" },
    { id: "fee", header: "Fee Type", accessorFn: (r) => r.fee?.name ?? "" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => (row.getValue("amount") as number).toLocaleString() },
    { accessorKey: "amountPaid", header: "Paid", cell: ({ row }) => (row.getValue("amountPaid") as number).toLocaleString() },
    { accessorKey: "balance", header: "Balance", cell: ({ row }) => (row.getValue("balance") as number).toLocaleString() },
    { accessorKey: "paymentMethod", header: "Method" },
    { id: "date", header: "Date", accessorFn: (r) => formatDate(r.paymentDate) },
  ]

  const examResultColumns: ColumnDef<ExamResultData>[] = [
    { id: "student", header: "Student", accessorFn: (r) => `${r.student.lastName} ${r.student.firstName}` },
    { id: "admission", header: "Admission No", accessorFn: (r) => r.student.admissionNumber },
    { id: "subject", header: "Subject", accessorFn: (r) => r.subject.name },
    { accessorKey: "test1", header: "Test 1" },
    { accessorKey: "test2", header: "Test 2" },
    { accessorKey: "assignment", header: "Assignment" },
    { accessorKey: "examination", header: "Exam" },
    { accessorKey: "total", header: "Total" },
    { accessorKey: "grade", header: "Grade" },
    { accessorKey: "position", header: "Pos", cell: ({ row }) => row.getValue("position") ?? "-" },
  ]

  const hifzColumns: ColumnDef<HifzData>[] = [
    { id: "student", header: "Student", accessorFn: (r) => `${r.student.lastName} ${r.student.firstName}` },
    { id: "admission", header: "Admission No", accessorFn: (r) => r.student.admissionNumber },
    { id: "class", header: "Class", accessorFn: (r) => r.class?.name ?? "N/A" },
    { accessorKey: "currentJuz", header: "Juz" },
    { accessorKey: "currentSurah", header: "Surah" },
    { accessorKey: "memorizationPercent", header: "Mem. %", cell: ({ row }) => {
      const v = row.getValue("memorizationPercent") as number | null
      return v != null ? `${Math.round(v)}%` : "-"
    }},
    { accessorKey: "sabak", header: "Sabak", cell: ({ row }) => (row.getValue("sabak") as string) || "-" },
    { accessorKey: "sabqi", header: "Sabqi", cell: ({ row }) => (row.getValue("sabqi") as string) || "-" },
  ]

  const characterColumns: ColumnDef<CharacterData>[] = [
    { id: "student", header: "Student", accessorFn: (r) => `${r.student.lastName} ${r.student.firstName}` },
    { id: "admission", header: "Admission No", accessorFn: (r) => r.student.admissionNumber },
    { accessorKey: "discipline", header: "Discipline" },
    { accessorKey: "punctuality", header: "Punctuality" },
    { accessorKey: "respect", header: "Respect" },
    { accessorKey: "akhlaq", header: "Akhlaq" },
    { accessorKey: "leadership", header: "Leadership" },
    { accessorKey: "cleanliness", header: "Cleanliness" },
  ]

  // ─── Preview Renders ─────────────────────────────────────────────────────
  function renderPreview() {
    if (!selectedReport) return null
    switch (selectedReport.id) {
      case "student-list": {
        const filtered = studentClassFilter ? students.filter((s) => s.class?.id === studentClassFilter) : students
        return (
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={studentClassFilter} onValueChange={async (v) => { setStudentClassFilter(v); setStudents(await fetchStudentList(v)) }}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground pb-1">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            <DataTable columns={studentColumns} data={filtered} searchKey="search" searchPlaceholder="Search students..." pageSize={10} />
          </div>
        )
      }
      case "teacher-list":
        return <DataTable columns={teacherColumns} data={teacherData} searchKey="search" searchPlaceholder="Search teachers..." pageSize={10} />
      case "class-list":
        return <DataTable columns={classColumns} data={classData} searchKey="search" searchPlaceholder="Search classes..." pageSize={10} />
      case "attendance":
        return (
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-44" />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={attendanceClassFilter} onValueChange={setAttendanceClassFilter}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={async () => { setAttendanceData(await fetchAttendance(attendanceDate, attendanceClassFilter)) }}>Load</Button>
            </div>
            <DataTable columns={attendanceColumns} data={attendanceData} pageSize={10} />
          </div>
        )
      case "fee":
        return <DataTable columns={paymentColumns} data={paymentData} searchKey="search" searchPlaceholder="Search payments..." pageSize={10} />
      case "examination":
        return (
          <div className="space-y-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="space-y-2">
                <Label>Exam</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger className="w-60"><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.title} ({e.term} - {e.academicYear})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleLoadExamResults} disabled={!selectedExamId}>Load Results</Button>
            </div>
            <DataTable columns={examResultColumns} data={examResults} searchKey="search" searchPlaceholder="Search results..." pageSize={10} />
          </div>
        )
      case "hifz":
        return (
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={hifzClassFilter} onValueChange={setHifzClassFilter}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DataTable columns={hifzColumns} data={hifzClassFilter ? hifzData.filter((h) => h.class?.id === hifzClassFilter) : hifzData} searchKey="search" searchPlaceholder="Search..." pageSize={10} />
          </div>
        )
      case "character":
        return (
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={charClassFilter} onValueChange={setCharClassFilter}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DataTable columns={characterColumns} data={charClassFilter ? characterData.filter((c) => {
              const s = students.find((st) => st.id === c.student.id)
              return s?.class?.id === charClassFilter
            }) : characterData} searchKey="search" searchPlaceholder="Search..." pageSize={10} />
          </div>
        )
      case "student-profile":
        return (
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label>Select Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                  <SelectContent>
                    {allStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.admissionNumber})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleLoadStudentProfile} disabled={!selectedStudentId}>Load Profile</Button>
            </div>
            {studentProfile && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {studentProfile.student.lastName} {studentProfile.student.firstName}</p>
                    <p><span className="font-medium">Admission:</span> {studentProfile.student.admissionNumber}</p>
                    <p><span className="font-medium">Gender:</span> {studentProfile.student.gender}</p>
                    <p><span className="font-medium">Class:</span> {studentProfile.student.className}</p>
                    <p><span className="font-medium">Status:</span> {studentProfile.student.status}</p>
                    <p><span className="font-medium">Parent:</span> {studentProfile.student.parentName} ({studentProfile.student.parentPhone})</p>
                  </CardContent>
                </Card>
                {studentProfile.hifz && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Hifz Progress</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><span className="font-medium">Current Juz:</span> {studentProfile.hifz.currentJuz}</p>
                      <p><span className="font-medium">Current Surah:</span> {studentProfile.hifz.currentSurah}</p>
                      <p><span className="font-medium">Memorization:</span> {studentProfile.hifz.memorizationPercent != null ? `${Math.round(studentProfile.hifz.memorizationPercent)}%` : "N/A"}</p>
                      <p><span className="font-medium">Sabak:</span> {studentProfile.hifz.sabak ?? "N/A"}</p>
                      <p><span className="font-medium">Sabqi:</span> {studentProfile.hifz.sabqi ?? "N/A"}</p>
                    </CardContent>
                  </Card>
                )}
                {studentProfile.character && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Character Assessment</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><span className="font-medium">Discipline:</span> {studentProfile.character.discipline}</p>
                      <p><span className="font-medium">Punctuality:</span> {studentProfile.character.punctuality}</p>
                      <p><span className="font-medium">Respect:</span> {studentProfile.character.respect}</p>
                      <p><span className="font-medium">Akhlaq:</span> {studentProfile.character.akhlaq}</p>
                      <p><span className="font-medium">Leadership:</span> {studentProfile.character.leadership}</p>
                      <p><span className="font-medium">Cleanliness:</span> {studentProfile.character.cleanliness}</p>
                    </CardContent>
                  </Card>
                )}
                {studentProfile.character?.teacherRemarks && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Teacher Remarks</CardTitle></CardHeader>
                    <CardContent><p className="text-sm">{studentProfile.character.teacherRemarks}</p></CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )
      case "class-summary":
        return (
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Select Class</Label>
                <Select value={summaryClassFilter} onValueChange={setSummaryClassFilter}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="Choose a class..." /></SelectTrigger>
                  <SelectContent>
                    {classData.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleLoadClassSummary} disabled={!summaryClassFilter}>Load Summary</Button>
            </div>
            {summaryData && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{summaryData.totalStudents}</p><p className="text-xs text-muted-foreground mt-1">Total Students</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{summaryData.attendanceCount}</p><p className="text-xs text-muted-foreground mt-1">Attendance Records</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{summaryData.attendanceRate}%</p><p className="text-xs text-muted-foreground mt-1">Attendance Rate</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-sm font-medium">{summaryData.class.name}</p><p className="text-xs text-muted-foreground mt-1">Teacher: {summaryData.class.teacher?.fullName ?? "Unassigned"}</p></CardContent></Card>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (loading) return <PageLoading />

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate and export school reports" />

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 print:shadow-none" onClick={() => handleGenerateReport(report)}>
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={cn("p-3 rounded-xl transition-colors group-hover:scale-110 duration-200", report.bgColor)}>
                    <Icon className={cn("h-7 w-7", report.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{report.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-1">Generate</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col print:max-w-full print:max-h-full print:border-0 print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && (() => { const Icon = selectedReport.icon; return <Icon className="h-5 w-5 text-primary" /> })()}
              {selectedReport?.title}
            </DialogTitle>
            <DialogDescription>{selectedReport?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4 print:overflow-visible">{renderPreview()}</div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t print:hidden">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}><X className="h-4 w-4 mr-2" />Close</Button>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button size="sm" onClick={handleExportPDF}><FileText className="h-4 w-4 mr-2" />Export PDF</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
