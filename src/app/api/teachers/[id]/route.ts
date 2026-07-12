import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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

    const teacher = await prisma.teacher.findUnique({
      where: { id, tenantId },
      include: {
        classes: {
          select: { id: true, name: true, code: true },
        },
        subjects: {
          include: {
            subject: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    })

    if (!teacher) {
      return Response.json({ error: "Teacher not found" }, { status: 404 })
    }

    return Response.json(teacher)
  } catch (error) {
    console.error("Error fetching teacher:", error)
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
    const body = await req.json()

    const existing = await prisma.teacher.findUnique({ where: { id, tenantId } })
    if (!existing) {
      return Response.json({ error: "Teacher not found" }, { status: 404 })
    }

    const { classIds, subjectIds, ...teacherData } = body

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...teacherData,
        dateEmployed: teacherData.dateEmployed ? new Date(teacherData.dateEmployed) : undefined,
      },
    })

    if (classIds) {
      await prisma.class.updateMany({
        where: { tenantId, teacherId: id },
        data: { teacherId: null },
      })
      const ids = classIds as string[]
      if (ids.length > 0) {
        await prisma.class.updateMany({
          where: { tenantId, id: { in: ids } },
          data: { teacherId: id },
        })
      }
    }

    if (subjectIds) {
      await prisma.subjectTeacher.deleteMany({ where: { tenantId, teacherId: id } })
      if (subjectIds.length > 0) {
        await prisma.subjectTeacher.createMany({
          data: subjectIds.map((subjectId: string) => ({
            subjectId,
            teacherId: id,
            tenantId,
          })),
        })
      }
    }

    return Response.json(teacher)
  } catch (error) {
    console.error("Error updating teacher:", error)
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

    const existing = await prisma.teacher.findUnique({ where: { id, tenantId } })
    if (!existing) {
      return Response.json({ error: "Teacher not found" }, { status: 404 })
    }

    await prisma.teacher.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
