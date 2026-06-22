import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { examSchema } from "@/schemas"
import { calculateGrade } from "@/lib/utils"

async function getMaxScores() {
  const settings = await prisma.systemSettings.findMany({
    where: { key: { in: ["exam.test1Max", "exam.test2Max", "exam.assignmentMax", "exam.examinationMax", "grading_scale"] } },
  })
  const map = new Map(settings.map((s) => [s.key, s.value]))
  return {
    test1: parseInt(map.get("exam.test1Max") ?? "10"),
    test2: parseInt(map.get("exam.test2Max") ?? "10"),
    assignment: parseInt(map.get("exam.assignmentMax") ?? "10"),
    examination: parseInt(map.get("exam.examinationMax") ?? "70"),
    gradeScale: map.get("grading_scale") ? (JSON.parse(map.get("grading_scale")!) as { grade: string; minPercent: number; maxPercent: number }[]) : undefined,
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { results: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(exams)
  } catch (error) {
    console.error("Error fetching exams:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = examSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        term: data.term,
        academicYear: data.academicYear,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    })

    if (body.results && Array.isArray(body.results)) {
      const maxScores = await getMaxScores()
      const maxTotal = maxScores.test1 + maxScores.test2 + maxScores.assignment + maxScores.examination
      const resultsData = body.results.map(
        (result: {
          studentId: string
          classId: string
          subjectId: string
          test1?: number
          test2?: number
          assignment?: number
          examination?: number
        }) => {
          const test1 = result.test1 ?? 0
          const test2 = result.test2 ?? 0
          const assignment = result.assignment ?? 0
          const examination = result.examination ?? 0
          const total = test1 + test2 + assignment + examination
          const grade = calculateGrade(total, maxTotal, maxScores.gradeScale)

          return {
            examId: exam.id,
            studentId: result.studentId,
            classId: result.classId,
            subjectId: result.subjectId,
            test1,
            test2,
            assignment,
            examination,
            total,
            grade,
          }
        }
      )

      await prisma.examResult.createMany({ data: resultsData })
    }

    const created = await prisma.exam.findUnique({
      where: { id: exam.id },
      include: {
        _count: { select: { results: true } },
      },
    })

    return Response.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creating exam:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
