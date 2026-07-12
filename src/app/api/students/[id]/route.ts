import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { studentSchema } from "@/schemas"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id, tenantId },
      include: {
        class: {
          select: { id: true, name: true, code: true },
        },
        attendances: {
          include: { class: { select: { id: true, name: true } } },
          orderBy: { date: "desc" },
          take: 50,
        },
        examResults: {
          include: {
            exam: { select: { id: true, title: true, term: true, academicYear: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        hifzRecords: {
          include: { class: { select: { id: true, name: true } } },
        },
        assessments: true,
        payments: {
          include: { fee: { select: { id: true, name: true, amount: true } } },
          orderBy: { paymentDate: "desc" },
          take: 20,
        },
      },
    })

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 })
    }

    return Response.json(student)
  } catch (error) {
    console.error("Error fetching student:", error)
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

    const tenantId = session.user.tenantId!
    const { id } = await params

    const existing = await prisma.student.findUnique({ where: { id, tenantId } })
    if (!existing) {
      return Response.json({ error: "Student not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = studentSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (data.admissionNumber !== undefined) updateData.admissionNumber = data.admissionNumber
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.otherName !== undefined) updateData.otherName = data.otherName
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth)
    if (data.parentName !== undefined) updateData.parentName = data.parentName
    if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone
    if (data.parentEmail !== undefined) updateData.parentEmail = data.parentEmail || null
    if (data.address !== undefined) updateData.address = data.address
    if (data.classId !== undefined) updateData.classId = data.classId || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.passportPhoto !== undefined) updateData.passportPhoto = data.passportPhoto || null

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    return Response.json(student)
  } catch (error) {
    console.error("Error updating student:", error)
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

    const tenantId = session.user.tenantId!
    const { id } = await params

    const existing = await prisma.student.findUnique({ where: { id, tenantId } })
    if (!existing) {
      return Response.json({ error: "Student not found" }, { status: 404 })
    }

    await prisma.student.delete({ where: { id } })

    return Response.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
