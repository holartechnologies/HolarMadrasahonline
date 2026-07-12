import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { feeSchema } from "@/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const fees = await prisma.fee.findMany({
      where: { tenantId },
      include: {
        payments: {
          select: {
            id: true,
            studentId: true,
            amountPaid: true,
            paymentMethod: true,
            receiptNumber: true,
            paymentDate: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
              },
            },
          },
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
        _count: {
          select: { payments: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return Response.json(fees)
  } catch (error) {
    console.error("Error fetching fees:", error)
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
    const parsed = feeSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const fee = await prisma.fee.create({
      data: {
        tenantId,
        name: data.name,
        amount: data.amount,
        description: data.description || null,
      },
    })

    return Response.json(fee, { status: 201 })
  } catch (error) {
    console.error("Error creating fee:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
