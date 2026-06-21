import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { attendanceSchema } from "@/schemas"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const classId = searchParams.get("classId")
    const studentId = searchParams.get("studentId")

    const where: Record<string, unknown> = {}

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      where.date = { gte: startDate, lte: endDate }
    }
    if (classId) where.classId = classId
    if (studentId) where.studentId = studentId

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            classId: true,
          },
        },
        class: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { date: "desc" },
    })

    return Response.json(records)
  } catch (error) {
    console.error("Error fetching attendance:", error)
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
    const { records } = body

    if (!Array.isArray(records) || records.length === 0) {
      return Response.json({ error: "Records array is required" }, { status: 400 })
    }

    const results = []
    for (const record of records) {
      const parsed = attendanceSchema.safeParse(record)
      if (!parsed.success) {
        return Response.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const data = parsed.data
      const result = await prisma.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: data.studentId,
            classId: data.classId,
            date: new Date(data.date),
          },
        },
        update: {
          status: data.status,
          remarks: data.remarks || null,
          recordedById: session.user?.id,
        },
        create: {
          studentId: data.studentId,
          classId: data.classId,
          date: new Date(data.date),
          status: data.status,
          remarks: data.remarks || null,
          recordedById: session.user?.id,
        },
      })
      results.push(result)
    }

    return Response.json({ records: results }, { status: 201 })
  } catch (error) {
    console.error("Error recording attendance:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Attendance ID is required" }, { status: 400 })
    }

    const existing = await prisma.attendance.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Attendance record not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = attendanceSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (data.studentId !== undefined) updateData.studentId = data.studentId
    if (data.classId !== undefined) updateData.classId = data.classId
    if (data.date !== undefined) updateData.date = new Date(data.date)
    if (data.status !== undefined) updateData.status = data.status
    if (data.remarks !== undefined) updateData.remarks = data.remarks || null

    const record = await prisma.attendance.update({
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
    console.error("Error updating attendance:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
