import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { characterAssessmentSchema } from "@/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const assessments = await prisma.characterAssessment.findMany({
      where: { tenantId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return Response.json(assessments)
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const body = await req.json()
    const parsed = characterAssessmentSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const assessment = await prisma.characterAssessment.upsert({
      where: {
        tenantId_studentId: { tenantId, studentId: data.studentId },
      },
      update: {
        discipline: data.discipline,
        punctuality: data.punctuality,
        respect: data.respect,
        akhlaq: data.akhlaq,
        leadership: data.leadership,
        cleanliness: data.cleanliness,
        teacherRemarks: data.teacherRemarks || null,
        assessedById: session.user?.id,
      },
      create: {
        tenantId,
        studentId: data.studentId,
        discipline: data.discipline,
        punctuality: data.punctuality,
        respect: data.respect,
        akhlaq: data.akhlaq,
        leadership: data.leadership,
        cleanliness: data.cleanliness,
        teacherRemarks: data.teacherRemarks || null,
        assessedById: session.user?.id,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
    })

    return Response.json(assessment, { status: 201 })
  } catch (error) {
    console.error("Error creating assessment:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
