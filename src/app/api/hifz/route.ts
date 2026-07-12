import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { hifzRecordSchema } from "@/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const records = await prisma.hifzRecord.findMany({
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
        class: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { dateUpdated: "desc" },
    })

    return Response.json(records)
  } catch (error) {
    console.error("Error fetching hifz records:", error)
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
    const parsed = hifzRecordSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const record = await prisma.hifzRecord.upsert({
      where: { tenantId_studentId: { tenantId, studentId: data.studentId } },
      update: {
        classId: data.classId,
        currentJuz: data.currentJuz,
        currentSurah: data.currentSurah,
        sabak: data.sabak || null,
        sabqi: data.sabqi || null,
        manzil: data.manzil || null,
        memorizationPercent: data.memorizationPercent,
        teacherRemarks: data.teacherRemarks || null,
        dateUpdated: new Date(),
      },
      create: {
        tenantId,
        studentId: data.studentId,
        classId: data.classId,
        currentJuz: data.currentJuz,
        currentSurah: data.currentSurah,
        sabak: data.sabak || null,
        sabqi: data.sabqi || null,
        manzil: data.manzil || null,
        memorizationPercent: data.memorizationPercent,
        teacherRemarks: data.teacherRemarks || null,
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
        class: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    return Response.json(record, { status: 201 })
  } catch (error) {
    console.error("Error creating hifz record:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Hifz record ID is required" }, { status: 400 })
    }

    const existing = await prisma.hifzRecord.findUnique({ where: { id, tenantId } })
    if (!existing) {
      return Response.json({ error: "Hifz record not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = hifzRecordSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = { dateUpdated: new Date() }

    if (data.studentId !== undefined) updateData.studentId = data.studentId
    if (data.classId !== undefined) updateData.classId = data.classId
    if (data.currentJuz !== undefined) updateData.currentJuz = data.currentJuz
    if (data.currentSurah !== undefined) updateData.currentSurah = data.currentSurah
    if (data.sabak !== undefined) updateData.sabak = data.sabak || null
    if (data.sabqi !== undefined) updateData.sabqi = data.sabqi || null
    if (data.manzil !== undefined) updateData.manzil = data.manzil || null
    if (data.memorizationPercent !== undefined) updateData.memorizationPercent = data.memorizationPercent
    if (data.teacherRemarks !== undefined) updateData.teacherRemarks = data.teacherRemarks || null

    const record = await prisma.hifzRecord.update({
      where: { id },
      data: updateData,
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
      },
    })

    return Response.json(record)
  } catch (error) {
    console.error("Error updating hifz record:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
