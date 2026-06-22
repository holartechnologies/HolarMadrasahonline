"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { useToast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import {
  Settings,
  School,
  BookOpen,
  Bell,
  Save,
  CheckCircle2,
  GraduationCap,
  ClipboardList,
  BarChart3,
  CalendarDays,
  Plus,
  Trash2,
  Image,
  Upload,
} from "lucide-react"

interface GeneralSettings {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  schoolMotto: string
  schoolLogo: string
}

interface GradingScaleItem {
  grade: string
  minPercent: number
  maxPercent: number
  remark: string
}

interface AcademicSettings {
  currentYear: string
  currentTerm: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  defaultLanguage: string
}

interface AcademicYearItem {
  id: string
  gregorianStart: number
  gregorianEnd: number
  hijriStart: number
  hijriEnd: number
  isCurrent: boolean
}

interface AssessmentWeights {
  test1Max: number
  test2Max: number
  assignmentMax: number
  examinationMax: number
}

const defaultGeneral: GeneralSettings = {
  schoolName: "Ihya'us Sunnah Islamic School",
  schoolAddress: "No. 1, Islamic Avenue, Madinah Quarter",
  schoolPhone: "+234-800-SUNNAH",
  schoolEmail: "info@ihyaahussunah.com",
  schoolMotto: "Reviving the Sunnah through Knowledge and Action",
  schoolLogo: "",
}

const defaultGradingScale: GradingScaleItem[] = [
  { grade: "A", minPercent: 70, maxPercent: 100, remark: "Excellent" },
  { grade: "B", minPercent: 60, maxPercent: 69, remark: "Very Good" },
  { grade: "C", minPercent: 50, maxPercent: 59, remark: "Good" },
  { grade: "D", minPercent: 45, maxPercent: 49, remark: "Fair" },
  { grade: "E", minPercent: 40, maxPercent: 44, remark: "Pass" },
  { grade: "F", minPercent: 0, maxPercent: 39, remark: "Fail" },
]

const defaultAcademic: AcademicSettings = {
  currentYear: "2025/2026",
  currentTerm: "1st",
}

const defaultNotifications: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  defaultLanguage: "English",
}

const LANGUAGES = ["English", "Arabic", "Hausa", "French"] as const
const TERMS = ["1st", "2nd", "3rd"] as const

const gradingScale = [
  { grade: "A", range: "70% - 100%", remark: "Excellent" },
  { grade: "B", range: "60% - 69%", remark: "Very Good" },
  { grade: "C", range: "50% - 59%", remark: "Good" },
  { grade: "D", range: "45% - 49%", remark: "Fair" },
  { grade: "E", range: "40% - 44%", remark: "Pass" },
  { grade: "F", range: "0% - 39%", remark: "Fail" },
]

const defaultAssessmentWeights: AssessmentWeights = {
  test1Max: 10,
  test2Max: 10,
  assignmentMax: 10,
  examinationMax: 70,
}

export default function SettingsPage() {
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral)
  const [academic, setAcademic] = useState<AcademicSettings>(defaultAcademic)
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications)
  const [assessmentWeights, setAssessmentWeights] = useState<AssessmentWeights>(defaultAssessmentWeights)
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([])
  const [gradingScale, setGradingScale] = useState<GradingScaleItem[]>(defaultGradingScale)
  const [saving, setSaving] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [newYear, setNewYear] = useState({ gregorianStart: "", gregorianEnd: "", hijriStart: "", hijriEnd: "" })
  const [addingYear, setAddingYear] = useState(false)
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 })
  const { toast } = useToast()

  useEffect(() => {
    async function loadSettings() {
      try {
        const [settingsRes, yearsRes, studentsRes, teachersRes, classesRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/academic-years"),
          fetch("/api/students"),
          fetch("/api/teachers"),
          fetch("/api/classes"),
        ])
        if (settingsRes.ok) {
          const data: { key: string; value: string }[] = await settingsRes.json()
          const map = new Map(data.map((s) => [s.key, s.value]))
          setGeneral((prev) => ({
            ...prev,
            schoolName: map.get("school_name") ?? prev.schoolName,
            schoolAddress: map.get("school_address") ?? prev.schoolAddress,
            schoolPhone: map.get("school_phone") ?? prev.schoolPhone,
            schoolEmail: map.get("school_email") ?? prev.schoolEmail,
            schoolMotto: map.get("school_motto") ?? prev.schoolMotto,
            schoolLogo: map.get("school_logo") ?? "",
          }))
          setAssessmentWeights({
            test1Max: parseInt(map.get("exam.test1Max") ?? "10"),
            test2Max: parseInt(map.get("exam.test2Max") ?? "10"),
            assignmentMax: parseInt(map.get("exam.assignmentMax") ?? "10"),
            examinationMax: parseInt(map.get("exam.examinationMax") ?? "70"),
          })
          setAcademic((prev) => ({
            ...prev,
            currentYear: map.get("current_academic_year") ?? prev.currentYear,
            currentTerm: map.get("current_term") ?? prev.currentTerm,
          }))
          const scaleRaw = map.get("grading_scale")
          if (scaleRaw) {
            try { setGradingScale(JSON.parse(scaleRaw)) } catch { /* use defaults */ }
          }
        }
        if (yearsRes.ok) {
          const years = await yearsRes.json()
          setAcademicYears(years)
        }
        if (studentsRes.ok) {
          const sData = await studentsRes.json()
          const sArr = Array.isArray(sData) ? sData : (sData.students ?? sData.data ?? [])
          setStats((prev) => ({ ...prev, students: sArr.length }))
        }
        if (teachersRes.ok) {
          const tData = await teachersRes.json()
          const tArr = Array.isArray(tData) ? tData : (tData.teachers ?? tData.data ?? [])
          setStats((prev) => ({ ...prev, teachers: tArr.length }))
        }
        if (classesRes.ok) {
          const cData = await classesRes.json()
          const cArr = Array.isArray(cData) ? cData : (cData.classes ?? cData.data ?? [])
          setStats((prev) => ({ ...prev, classes: cArr.length }))
        }
      } catch {
        // use defaults
      } finally {
        setLoadingSettings(false)
      }
    }
    loadSettings()
  }, [])

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      localStorage.setItem("school-general", JSON.stringify(general))
      localStorage.setItem("school-academic", JSON.stringify(academic))
      localStorage.setItem("school-notifications", JSON.stringify(notifications))

      await Promise.all([
        saveSetting("school_name", general.schoolName),
        saveSetting("school_address", general.schoolAddress),
        saveSetting("school_phone", general.schoolPhone),
        saveSetting("school_email", general.schoolEmail),
        saveSetting("school_motto", general.schoolMotto),
        saveSetting("school_logo", general.schoolLogo),
        saveSetting("exam.test1Max", String(assessmentWeights.test1Max)),
        saveSetting("exam.test2Max", String(assessmentWeights.test2Max)),
        saveSetting("exam.assignmentMax", String(assessmentWeights.assignmentMax)),
        saveSetting("exam.examinationMax", String(assessmentWeights.examinationMax)),
        saveSetting("current_academic_year", academic.currentYear),
        saveSetting("current_term", academic.currentTerm),
        saveSetting("grading_scale", JSON.stringify(gradingScale)),
      ])

      toast({
        title: "Settings Saved",
        description: "All settings have been saved successfully.",
      })
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  function handleGeneralChange<K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) {
    setGeneral((prev) => ({ ...prev, [key]: value }))
  }

  function handleAcademicChange<K extends keyof AcademicSettings>(key: K, value: AcademicSettings[K]) {
    setAcademic((prev) => ({ ...prev, [key]: value }))
  }

  function handleNotificationChange<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAddYear() {
    const { gregorianStart, gregorianEnd, hijriStart, hijriEnd } = newYear
    if (!gregorianStart || !gregorianEnd || !hijriStart || !hijriEnd) {
      toast({ title: "Error", description: "All year fields are required", variant: "destructive" })
      return
    }
    setAddingYear(true)
    try {
      const res = await fetch("/api/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gregorianStart: parseInt(gregorianStart),
          gregorianEnd: parseInt(gregorianEnd),
          hijriStart: parseInt(hijriStart),
          hijriEnd: parseInt(hijriEnd),
        }),
      })
      if (!res.ok) throw new Error("Failed to add academic year")
      const year = await res.json()
      setAcademicYears((prev) => [...prev, year])
      setNewYear({ gregorianStart: "", gregorianEnd: "", hijriStart: "", hijriEnd: "" })
      toast({ title: "Success", description: "Academic year added" })
    } catch {
      toast({ title: "Error", description: "Failed to add academic year", variant: "destructive" })
    } finally {
      setAddingYear(false)
    }
  }

  async function handleSetCurrentYear(id: string) {
    try {
      const res = await fetch(`/api/academic-years?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true }),
      })
      if (!res.ok) throw new Error("Failed to update")
      const updated = await res.json()
      setAcademicYears((prev) =>
        prev.map((y) => ({ ...y, isCurrent: y.id === id }))
      )
      setAcademic((prev) => ({
        ...prev,
        currentYear: `${updated.gregorianStart}/${updated.gregorianEnd}`,
      }))
      toast({ title: "Success", description: "Current academic year updated" })
    } catch {
      toast({ title: "Error", description: "Failed to set current year", variant: "destructive" })
    }
  }

  async function handleDeleteYear(id: string) {
    try {
      const res = await fetch(`/api/academic-years?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setAcademicYears((prev) => prev.filter((y) => y.id !== id))
      toast({ title: "Success", description: "Academic year deleted" })
    } catch {
      toast({ title: "Error", description: "Failed to delete academic year", variant: "destructive" })
    }
  }

  function formatAcademicYearDisplay(y: AcademicYearItem) {
    return `${y.gregorianStart}/${y.gregorianEnd} — ${y.hijriStart}/${y.hijriEnd}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure system preferences"
      >
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Academic</span>
          </TabsTrigger>
          <TabsTrigger value="years" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Years</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <School className="h-5 w-5 text-primary" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School Logo</Label>
                <div className="flex items-center gap-4">
                  {general.schoolLogo ? (
                    <div className="relative h-20 w-20 rounded-lg border overflow-hidden bg-muted">
                      <img src={general.schoolLogo} alt="School logo" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/*"
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (!file) return
                        if (file.size > 500 * 1024) {
                          toast({ title: "Error", description: "Logo must be under 500KB", variant: "destructive" })
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = () => setGeneral((prev) => ({ ...prev, schoolLogo: reader.result as string }))
                        reader.readAsDataURL(file)
                      }
                      input.click()
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {general.schoolLogo ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {general.schoolLogo && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setGeneral((prev) => ({ ...prev, schoolLogo: "" }))}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={general.schoolName}
                  onChange={(e) => handleGeneralChange("schoolName", e.target.value)}
                  dir="auto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">School Address</Label>
                <Textarea
                  id="schoolAddress"
                  value={general.schoolAddress}
                  onChange={(e) => handleGeneralChange("schoolAddress", e.target.value)}
                  rows={3}
                  dir="auto"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">School Phone</Label>
                  <Input
                    id="schoolPhone"
                    value={general.schoolPhone}
                    onChange={(e) => handleGeneralChange("schoolPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">School Email</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    value={general.schoolEmail}
                    onChange={(e) => handleGeneralChange("schoolEmail", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolMotto">School Motto</Label>
                <Input
                  id="schoolMotto"
                  value={general.schoolMotto}
                  onChange={(e) => handleGeneralChange("schoolMotto", e.target.value)}
                  dir="auto"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.students}</p>
                  <p className="text-xs text-muted-foreground mt-1">Students Enrolled</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.teachers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Qualified Teachers</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.classes}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                Session Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentYear">Current Academic Year</Label>
                  <Input
                    id="currentYear"
                    value={academic.currentYear}
                    onChange={(e) => handleAcademicChange("currentYear", e.target.value)}
                    placeholder="2025/2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentTerm">Current Term</Label>
                  <Select
                    value={academic.currentTerm}
                    onValueChange={(value) => handleAcademicChange("currentTerm", value)}
                  >
                    <SelectTrigger id="currentTerm">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term} Term
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Grading Scale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the percentage ranges and remarks for each grade. Changes apply to all exam grade calculations.
              </p>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Grade</th>
                      <th className="text-left p-3 font-medium">Min %</th>
                      <th className="text-left p-3 font-medium">Max %</th>
                      <th className="text-left p-3 font-medium">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradingScale.map((item, idx) => (
                      <tr key={item.grade} className="border-t border-border/50">
                        <td className="p-3 font-semibold">{item.grade}</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="h-8 w-20"
                            value={item.minPercent}
                            onChange={(e) => setGradingScale((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], minPercent: parseInt(e.target.value) || 0 }
                              return next
                            })}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="h-8 w-20"
                            value={item.maxPercent}
                            onChange={(e) => setGradingScale((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], maxPercent: parseInt(e.target.value) || 0 }
                              return next
                            })}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            className="h-8"
                            value={item.remark}
                            onChange={(e) => setGradingScale((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], remark: e.target.value }
                              return next
                            })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                Assessment Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the maximum marks for each assessment component. These values apply to all exams.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Test 1 (max marks)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={assessmentWeights.test1Max}
                    onChange={(e) => setAssessmentWeights((p) => ({ ...p, test1Max: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Test 2 (max marks)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={assessmentWeights.test2Max}
                    onChange={(e) => setAssessmentWeights((p) => ({ ...p, test2Max: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignment (max marks)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={assessmentWeights.assignmentMax}
                    onChange={(e) => setAssessmentWeights((p) => ({ ...p, assignmentMax: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Examination (max marks)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    value={assessmentWeights.examinationMax}
                    onChange={(e) => setAssessmentWeights((p) => ({ ...p, examinationMax: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                <span className="font-medium">Total: </span>
                {assessmentWeights.test1Max + assessmentWeights.test2Max + assessmentWeights.assignmentMax + assessmentWeights.examinationMax} marks
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Years Tab */}
        <TabsContent value="years" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                Academic Years Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Gregorian Start</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2025"
                    value={newYear.gregorianStart}
                    onChange={(e) => setNewYear((p) => ({ ...p, gregorianStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gregorian End</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2026"
                    value={newYear.gregorianEnd}
                    onChange={(e) => setNewYear((p) => ({ ...p, gregorianEnd: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hijri Start</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1446"
                    value={newYear.hijriStart}
                    onChange={(e) => setNewYear((p) => ({ ...p, hijriStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hijri End</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1447"
                    value={newYear.hijriEnd}
                    onChange={(e) => setNewYear((p) => ({ ...p, hijriEnd: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleAddYear} disabled={addingYear}>
                <Plus className="mr-2 h-4 w-4" />
                {addingYear ? "Adding..." : "Add Academic Year"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Academic Years</CardTitle>
            </CardHeader>
            <CardContent>
              {academicYears.length === 0 ? (
                <p className="text-sm text-muted-foreground">No academic years defined yet.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Academic Year</th>
                        <th className="text-left p-3 font-medium">Gregorian</th>
                        <th className="text-left p-3 font-medium">Hijri</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicYears.map((y) => (
                        <tr key={y.id} className="border-t border-border/50">
                          <td className="p-3 font-medium">{y.gregorianStart}/{y.gregorianEnd} — {y.hijriStart}/{y.hijriEnd}</td>
                          <td className="p-3 text-muted-foreground">{y.gregorianStart}/{y.gregorianEnd}</td>
                          <td className="p-3 text-muted-foreground">{y.hijriStart}/{y.hijriEnd}</td>
                          <td className="p-3">
                            {y.isCurrent ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                Current
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetCurrentYear(y.id)}
                              >
                                Set as Current
                              </Button>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteYear(y.id)}
                              disabled={y.isCurrent}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive system alerts and reports via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS alerts for attendance and fee updates
                  </p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) => handleNotificationChange("smsNotifications", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select
                  value={notifications.defaultLanguage}
                  onValueChange={(value) => handleNotificationChange("defaultLanguage", value)}
                >
                  <SelectTrigger id="defaultLanguage" className="max-w-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sets the default language for the system interface and communications.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Islamic decorative footer */}
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30">
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 40px, currentColor 40px, currentColor 41px),
                repeating-linear-gradient(90deg, transparent, transparent 40px, currentColor 40px, currentColor 41px),
                repeating-linear-gradient(45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px),
                repeating-linear-gradient(135deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)
              `,
              backgroundSize: "80px 80px",
            }}
          />
        </div>
        <div className="relative p-5 text-center">
          <p className="text-sm text-muted-foreground" dir="rtl">
            رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire
          </p>
        </div>
      </div>
    </div>
  )
}
