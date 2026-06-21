"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Printer,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Hash,
  BookOpen,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/shared/page-header"
import { PageLoading } from "@/components/shared/loading"
import { useToast } from "@/components/ui/toaster"
import { formatDate } from "@/lib/utils"

interface StudentProfile {
  id: string
  admissionNumber: string
  firstName: string
  lastName: string
  otherName: string | null
  gender: string
  dateOfBirth: string
  passportPhoto: string | null
  parentName: string
  parentPhone: string
  parentEmail: string | null
  address: string
  status: string
  classId: string | null
  class: { id: string; name: string; code: string } | null
  createdAt: string
  attendances: {
    id: string
    date: string
    status: string
    remarks: string | null
    class: { id: string; name: string }
  }[]
  examResults: {
    id: string
    test1: number
    test2: number
    assignment: number
    examination: number
    total: number
    grade: string | null
    exam: { id: string; title: string; term: string; academicYear: string }
    subject: { id: string; name: string; code: string }
  }[]
  hifzRecords: {
    id: string
    currentJuz: number
    currentSurah: number
    sabak: string | null
    sabqi: string | null
    manzil: string | null
    memorizationPercent: number
    teacherRemarks: string | null
    assessmentDate: string
    class: { id: string; name: string }
  }[]
  assessments: {
    id: string
    discipline: string
    punctuality: string
    respect: string
    akhlaq: string
    leadership: string
    cleanliness: string
    teacherRemarks: string | null
    assessmentDate: string
  }[]
  payments: {
    id: string
    amountPaid: number
    paymentMethod: string
    receiptNumber: string
    paymentDate: string
    fee: { id: string; name: string; amount: number }
  }[]
}

export default function StudentProfilePage() {
  const params = useParams()
  const { toast } = useToast()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStudent() {
      try {
        setLoading(true)
        const res = await fetch(`/api/students/${params.id}`)
        if (!res.ok) throw new Error("Failed to fetch student")
        const json = await res.json()
        setStudent(json)
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load student",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [params.id, toast])

  if (loading) return <PageLoading />

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Student not found</p>
        <Button asChild variant="outline">
          <Link href="/students">Back to Students</Link>
        </Button>
      </div>
    )
  }

  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader title="Student Profile" description={`${student.firstName} ${student.lastName}`}>
        <Button variant="outline" asChild>
          <Link href="/students">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/students/${student.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-28 w-28 mb-4">
                {student.passportPhoto ? (
                  <img src={student.passportPhoto} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
              {student.otherName && (
                <p className="text-sm text-muted-foreground">{student.otherName}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {student.class ? `${student.class.name} (${student.class.code})` : "No class assigned"}
              </p>
              <Badge
                className="mt-3"
                variant={student.status === "Active" ? "default" : "secondary"}
              >
                {student.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Admission Number</p>
                  <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Gender</p>
                  <p className="text-sm text-muted-foreground capitalize">{student.gender}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">{formatDate(student.dateOfBirth)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date Admitted</p>
                  <p className="text-sm text-muted-foreground">{formatDate(student.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Parent / Guardian</p>
                  <p className="text-sm text-muted-foreground">{student.parentName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{student.parentPhone}</p>
                </div>
              </div>
              {student.parentEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{student.parentEmail}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{student.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="attendance">
            <TabsList>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="hifz">Hifz</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="mt-4">
              {student.attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No attendance records found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.attendances.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDate(a.date)}</TableCell>
                        <TableCell>{a.class.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              a.status === "Present"
                                ? "default"
                                : a.status === "Absent"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.remarks || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              {student.examResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No exam results found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Test 1</TableHead>
                      <TableHead>Test 2</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.examResults.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-medium">{r.exam.title}</p>
                          <p className="text-xs text-muted-foreground">{r.exam.term} - {r.exam.academicYear}</p>
                        </TableCell>
                        <TableCell>{r.subject.name}</TableCell>
                        <TableCell>{r.test1}</TableCell>
                        <TableCell>{r.test2}</TableCell>
                        <TableCell>{r.assignment}</TableCell>
                        <TableCell>{r.examination}</TableCell>
                        <TableCell className="font-medium">{r.total}</TableCell>
                        <TableCell>
                          <Badge variant={r.grade === "F" ? "destructive" : "default"}>
                            {r.grade || "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="hifz" className="mt-4">
              {student.hifzRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hifz records found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Juz</TableHead>
                      <TableHead>Surah</TableHead>
                      <TableHead>Sabak</TableHead>
                      <TableHead>Sabqi</TableHead>
                      <TableHead>Manzil</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.hifzRecords.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{formatDate(h.assessmentDate)}</TableCell>
                        <TableCell>{h.currentJuz}</TableCell>
                        <TableCell>{h.currentSurah}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{h.sabak || "—"}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{h.sabqi || "—"}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{h.manzil || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${h.memorizationPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{h.memorizationPercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">
                          {h.teacherRemarks || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="assessments" className="mt-4">
              {student.assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No character assessments found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Discipline</TableHead>
                      <TableHead>Punctuality</TableHead>
                      <TableHead>Respect</TableHead>
                      <TableHead>Akhlaq</TableHead>
                      <TableHead>Leadership</TableHead>
                      <TableHead>Cleanliness</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.assessments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDate(a.assessmentDate)}</TableCell>
                        <TableCell>
                          <RatingBadge value={a.discipline} />
                        </TableCell>
                        <TableCell>
                          <RatingBadge value={a.punctuality} />
                        </TableCell>
                        <TableCell>
                          <RatingBadge value={a.respect} />
                        </TableCell>
                        <TableCell>
                          <RatingBadge value={a.akhlaq} />
                        </TableCell>
                        <TableCell>
                          <RatingBadge value={a.leadership} />
                        </TableCell>
                        <TableCell>
                          <RatingBadge value={a.cleanliness} />
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">
                          {a.teacherRemarks || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="fees" className="mt-4">
              {student.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No payment records found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell>{p.fee.name}</TableCell>
                        <TableCell>${p.fee.amount.toFixed(2)}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${p.amountPaid.toFixed(2)}
                        </TableCell>
                        <TableCell className="capitalize">{p.paymentMethod}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {p.receiptNumber}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function RatingBadge({ value }: { value: string }) {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Excellent: "default",
    "Very Good": "default",
    Good: "secondary",
    Fair: "outline",
    Poor: "destructive",
  }
  return <Badge variant={variantMap[value] || "outline"}>{value}</Badge>
}
