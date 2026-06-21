import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { studentSchema } from "@/schemas"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const classId = searchParams.get("classId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}

    if (classId) where.classId = classId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { admissionNumber: { contains: search } },
        { parentName: { contains: search } },
      ]
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
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
    const parsed = studentSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const year = new Date().getFullYear()
    const prefix = `IHYSU/${year}/`
    const lastStudent = await prisma.student.findFirst({
      where: { admissionNumber: { startsWith: prefix } },
      orderBy: { admissionNumber: "desc" },
    })
    let nextNum = 1
    if (lastStudent) {
      const parts = lastStudent.admissionNumber.split("/")
      const num = parseInt(parts[2], 10)
      if (!isNaN(num)) nextNum = num + 1
    }
    const admissionNumber = `${prefix}${String(nextNum).padStart(3, "0")}`

    const student = await prisma.student.create({
      data: {
        admissionNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        otherName: data.otherName,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        passportPhoto: data.passportPhoto || null,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail || null,
        address: data.address,
        classId: data.classId || null,
        status: data.status || "Active",
      },
      include: {
        class: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    return Response.json(student, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Student ID is required" }, { status: 400 })
    }

    const existing = await prisma.student.findUnique({ where: { id } })
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
