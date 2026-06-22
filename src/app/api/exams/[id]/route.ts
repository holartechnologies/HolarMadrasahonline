import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
              },
            },
            class: {
              select: { id: true, name: true, code: true },
            },
            subject: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: [
            { subjectId: "asc" },
            { total: "desc" },
          ],
        },
      },
    })

    if (!exam) {
      return Response.json({ error: "Exam not found" }, { status: 404 })
    }

    return Response.json(exam)
  } catch (error) {
    console.error("Error fetching exam:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.exam.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Exam not found" }, { status: 404 })
    }

    const body = await req.json()

    if (body.results && Array.isArray(body.results)) {
      const maxScores = await getMaxScores()
      const maxTotal = maxScores.test1 + maxScores.test2 + maxScores.assignment + maxScores.examination
      const resultsData = body.results.map(
        (result: {
          id?: string
          studentId: string
          classId: string
          subjectId: string
          test1?: number
          test2?: number
          assignment?: number
          examination?: number
          isApproved?: boolean
        }) => {
          const test1 = result.test1 ?? 0
          const test2 = result.test2 ?? 0
          const assignment = result.assignment ?? 0
          const examination = result.examination ?? 0
          const total = test1 + test2 + assignment + examination
          const grade = calculateGrade(total, maxTotal, maxScores.gradeScale)

          return {
            examId: id,
            studentId: result.studentId,
            classId: result.classId,
            subjectId: result.subjectId,
            test1,
            test2,
            assignment,
            examination,
            total,
            grade,
            isApproved: result.isApproved ?? false,
          }
        }
      )

      for (const result of resultsData) {
        await prisma.examResult.upsert({
          where: {
            examId_studentId_subjectId: {
              examId: result.examId,
              studentId: result.studentId,
              subjectId: result.subjectId,
            },
          },
          update: result,
          create: result,
        })
      }

      const allResults = await prisma.examResult.findMany({
        where: { examId: id },
        orderBy: [
          { subjectId: "asc" },
          { total: "desc" },
        ],
      })

      let currentSubjectId = ""
      let position = 0
      let prevTotal = -1
      for (const result of allResults) {
        if (result.subjectId !== currentSubjectId) {
          currentSubjectId = result.subjectId
          position = 0
          prevTotal = -1
        }
        position++
        if ((result.total ?? 0) !== prevTotal) {
          prevTotal = result.total ?? 0
          await prisma.examResult.update({
            where: { id: result.id },
            data: { position },
          })
        }
      }
    }

    if (body.title || body.term || body.academicYear || body.startDate || body.endDate || body.isPublished !== undefined) {
      const updateData: Record<string, unknown> = {}
      if (body.title !== undefined) updateData.title = body.title
      if (body.term !== undefined) updateData.term = body.term
      if (body.academicYear !== undefined) updateData.academicYear = body.academicYear
      if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
      if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
      if (body.isPublished !== undefined) updateData.isPublished = body.isPublished

      await prisma.exam.update({
        where: { id },
        data: updateData,
      })
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
              },
            },
            class: {
              select: { id: true, name: true, code: true },
            },
            subject: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: [
            { subjectId: "asc" },
            { total: "desc" },
          ],
        },
      },
    })

    return Response.json(exam)
  } catch (error) {
    console.error("Error updating exam:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.exam.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Exam not found" }, { status: 404 })
    }

    const body = await req.json()
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.term !== undefined) updateData.term = body.term
    if (body.academicYear !== undefined) updateData.academicYear = body.academicYear
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished

    await prisma.exam.update({ where: { id }, data: updateData })

    return Response.json({ message: "Exam updated successfully" })
  } catch (error) {
    console.error("Error updating exam:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.exam.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Exam not found" }, { status: 404 })
    }

    await prisma.exam.delete({ where: { id } })

    return Response.json({ message: "Exam deleted successfully" })
  } catch (error) {
    console.error("Error deleting exam:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
