import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const years = await prisma.academicYear.findMany({
      orderBy: { gregorianStart: "desc" },
    })
    return Response.json(years)
  } catch (error) {
    console.error("Error fetching academic years:", error)
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
    const { gregorianStart, gregorianEnd, hijriStart, hijriEnd, isCurrent } = body

    if (!gregorianStart || !gregorianEnd || !hijriStart || !hijriEnd) {
      return Response.json({ error: "All year fields are required" }, { status: 400 })
    }

    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const year = await prisma.academicYear.create({
      data: {
        gregorianStart: parseInt(gregorianStart),
        gregorianEnd: parseInt(gregorianEnd),
        hijriStart: parseInt(hijriStart),
        hijriEnd: parseInt(hijriEnd),
        isCurrent: isCurrent ?? false,
      },
    })

    return Response.json(year, { status: 201 })
  } catch (error) {
    console.error("Error creating academic year:", error)
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
      return Response.json({ error: "ID is required" }, { status: 400 })
    }

    const body = await req.json()
    const { gregorianStart, gregorianEnd, hijriStart, hijriEnd, isCurrent } = body

    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const year = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(gregorianStart !== undefined && { gregorianStart: parseInt(gregorianStart) }),
        ...(gregorianEnd !== undefined && { gregorianEnd: parseInt(gregorianEnd) }),
        ...(hijriStart !== undefined && { hijriStart: parseInt(hijriStart) }),
        ...(hijriEnd !== undefined && { hijriEnd: parseInt(hijriEnd) }),
        ...(isCurrent !== undefined && { isCurrent }),
      },
    })

    return Response.json(year)
  } catch (error) {
    console.error("Error updating academic year:", error)
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
      return Response.json({ error: "ID is required" }, { status: 400 })
    }

    await prisma.academicYear.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting academic year:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
