import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { userSchema } from "@/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: {
        role: {
          select: { id: true, name: true, permissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
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
    const parsed = userSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await prisma.user.findFirst({
      where: { tenantId, username: data.username },
    })
    if (existing) {
      return Response.json({ error: "Username already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        tenantId,
        username: data.username,
        passwordHash,
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        roleId: data.roleId,
      },
      include: {
        role: {
          select: { id: true, name: true, permissions: true },
        },
      },
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
