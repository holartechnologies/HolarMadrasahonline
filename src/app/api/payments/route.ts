import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { paymentSchema } from "@/schemas"
import { generateReceiptNumber } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const feeId = searchParams.get("feeId")

    const where: Record<string, unknown> = { tenantId }

    if (studentId) where.studentId = studentId
    if (feeId) where.feeId = feeId

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        fee: {
          select: {
            id: true,
            name: true,
            amount: true,
            description: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    })

    return Response.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
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
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const fee = await prisma.fee.findUnique({
      where: { id: data.feeId, tenantId },
    })

    if (!fee) {
      return Response.json({ error: "Fee structure not found" }, { status: 404 })
    }

    const existingPayments = await prisma.payment.aggregate({
      where: {
        tenantId,
        studentId: data.studentId,
        feeId: data.feeId,
      },
      _sum: { amountPaid: true },
    })

    const totalPaidSoFar = existingPayments._sum.amountPaid ?? 0
    const newTotalPaid = totalPaidSoFar + data.amountPaid
    const balance = Math.max(0, fee.amount - newTotalPaid)

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        studentId: data.studentId,
        feeId: data.feeId,
        amount: fee.amount,
        amountPaid: data.amountPaid,
        balance,
        receiptNumber: generateReceiptNumber(),
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        notes: data.notes || null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        fee: {
          select: {
            id: true,
            name: true,
            amount: true,
            description: true,
          },
        },
      },
    })

    return Response.json(payment, { status: 201 })
  } catch (error) {
    console.error("Error recording payment:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
