import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { teacherSchema } from "@/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const teachers = await prisma.teacher.findMany({
      where: { tenantId },
      include: {
        classes: {
          select: { id: true, name: true, code: true },
        },
        subjects: {
          include: {
            subject: {
              select: { id: true, name: true, code: true, description: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(teachers)
  } catch (error) {
    console.error("Error fetching teachers:", error)
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
    const parsed = teacherSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const lastTeacher = await prisma.teacher.findFirst({
      where: { tenantId, staffId: { startsWith: "IHYSU/STF/" } },
      orderBy: { staffId: "desc" },
    })
    let nextNum = 1
    if (lastTeacher) {
      const parts = lastTeacher.staffId.split("/")
      const num = parseInt(parts[2], 10)
      if (!isNaN(num)) nextNum = num + 1
    }
    const staffId = `IHYSU/STF/${String(nextNum).padStart(3, "0")}`

    const teacher = await prisma.teacher.create({
      data: {
        tenantId,
        staffId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        qualification: data.qualification || null,
        dateEmployed: new Date(data.dateEmployed),
        subjects: data.subjectIds.length > 0
          ? {
              create: data.subjectIds.map((subjectId: string) => ({
                subjectId,
                tenantId,
              })),
            }
          : undefined,
      },
      include: {
        classes: {
          select: { id: true, name: true, code: true },
        },
        subjects: {
          include: {
            subject: {
              select: { id: true, name: true, code: true, description: true },
            },
          },
        },
      },
    })

    const classIds = data.classIds || []
    if (classIds.length > 0) {
      await prisma.class.updateMany({
        where: { tenantId, id: { in: classIds } },
        data: { teacherId: teacher.id },
      })
    }

    return Response.json(teacher, { status: 201 })
  } catch (error) {
    console.error("Error creating teacher:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Teacher ID is required" }, { status: 400 })
    }

    const existing = await prisma.teacher.findUnique({ where: { id, tenantId } })
    if (!existing) {
      return Response.json({ error: "Teacher not found" }, { status: 404 })
    }

    await prisma.teacher.delete({ where: { id } })

    return Response.json({ message: "Teacher deleted successfully" })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
