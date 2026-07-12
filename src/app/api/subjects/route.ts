import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { subjectSchema } from "@/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const subjects = await prisma.subject.findMany({
      where: { tenantId },
      include: {
        classes: {
          include: {
            class: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        teachers: {
          include: {
            teacher: {
              select: { id: true, staffId: true, fullName: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return Response.json(subjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
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
    const parsed = subjectSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const subject = await prisma.subject.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        description: data.description || null,
      },
      include: {
        classes: {
          include: {
            class: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        teachers: {
          include: {
            teacher: {
              select: { id: true, staffId: true, fullName: true },
            },
          },
        },
      },
    })

    return Response.json(subject, { status: 201 })
  } catch (error) {
    console.error("Error creating subject:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
