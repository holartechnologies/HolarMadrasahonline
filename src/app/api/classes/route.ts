import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { classSchema } from "@/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const classes = await prisma.class.findMany({
      where: { tenantId },
      include: {
        teacher: {
          select: { id: true, staffId: true, fullName: true },
        },
        _count: {
          select: { students: true },
        },
        subjects: {
          include: {
            subject: {
              select: { id: true, name: true, code: true, description: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return Response.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
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
    const parsed = classSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const cls = await prisma.class.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        teacherId: data.teacherId || null,
        status: data.status || "Active",
      },
      include: {
        teacher: {
          select: { id: true, staffId: true, fullName: true },
        },
        _count: {
          select: { students: true },
        },
      },
    })

    return Response.json(cls, { status: 201 })
  } catch (error) {
    console.error("Error creating class:", error)
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
      return Response.json({ error: "Class ID is required" }, { status: 400 })
    }

    const existing = await prisma.class.findUnique({ where: { id, tenantId } })
    if (!existing) {
      return Response.json({ error: "Class not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = classSchema.partial().safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.code !== undefined) updateData.code = data.code
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId || null
    if (data.status !== undefined) updateData.status = data.status

    const cls = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: { id: true, staffId: true, fullName: true },
        },
        _count: {
          select: { students: true },
        },
      },
    })

    return Response.json(cls)
  } catch (error) {
    console.error("Error updating class:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
