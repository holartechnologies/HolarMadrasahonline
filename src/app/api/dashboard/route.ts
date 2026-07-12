import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalFeesAgg,
      outstandingFeesAgg,
      todayAttendanceData,
      studentEnrollment,
      feeCollection,
      attendanceOverview,
      recentActivities,
      latestAdmissions,
    ] = await Promise.all([
      prisma.student.count({ where: { tenantId, status: "Active" } }),
      prisma.teacher.count({ where: { tenantId } }),
      prisma.class.count({ where: { tenantId, status: "Active" } }),
      prisma.subject.count({ where: { tenantId, isActive: true } }),
      prisma.payment.aggregate({
        where: { tenantId },
        _sum: { amountPaid: true },
      }),
      prisma.payment.aggregate({
        where: { tenantId, balance: { gt: 0 } },
        _sum: { balance: true },
      }),
      (async () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const [present, total] = await Promise.all([
          prisma.attendance.count({
            where: {
              tenantId,
              date: { gte: today, lt: tomorrow },
              status: "Present",
            },
          }),
          prisma.attendance.count({
            where: {
              tenantId,
              date: { gte: today, lt: tomorrow },
            },
          }),
        ])

        return { present, total }
      })(),
      prisma.class.findMany({
        where: { tenantId },
        select: {
          name: true,
          _count: { select: { students: true } },
        },
        orderBy: { name: "asc" },
      }),
      (async () => {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const payments = await prisma.payment.findMany({
          where: {
            tenantId,
            paymentDate: { gte: sixMonthsAgo },
          },
          select: {
            amountPaid: true,
            paymentDate: true,
          },
          orderBy: { paymentDate: "asc" },
        })

        const monthlyMap = new Map<string, number>()
        for (const p of payments) {
          const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, "0")}`
          monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.amountPaid)
        }

        return Array.from(monthlyMap.entries()).map(([month, total]) => ({
          month,
          total,
        }))
      })(),
      (async () => {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const records = await prisma.attendance.findMany({
          where: {
            tenantId,
            date: { gte: sixMonthsAgo },
          },
          select: {
            date: true,
            status: true,
          },
          orderBy: { date: "asc" },
        })

        const monthlyMap = new Map<
          string,
          { present: number; total: number }
        >()
        for (const r of records) {
          const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`
          const entry = monthlyMap.get(key) ?? { present: 0, total: 0 }
          entry.total++
          if (r.status === "Present") entry.present++
          monthlyMap.set(key, entry)
        }

        return Array.from(monthlyMap.entries()).map(([month, data]) => ({
          month,
          ...data,
        }))
      })(),
      prisma.activityLog.findMany({
        where: { tenantId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.student.findMany({
        where: { tenantId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          status: true,
          dateAdmitted: true,
          class: {
            select: { name: true },
          },
        },
        orderBy: { dateAdmitted: "desc" },
        take: 5,
      }),
    ])

    return Response.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalFeesCollected: totalFeesAgg._sum.amountPaid ?? 0,
      outstandingFees: outstandingFeesAgg._sum.balance ?? 0,
      todayAttendance: {
        present: todayAttendanceData.present,
        total: todayAttendanceData.total,
      },
      studentEnrollment: studentEnrollment.map((c) => ({
        className: c.name,
        count: c._count.students,
      })),
      feeCollection,
      attendanceOverview,
      recentActivities,
      latestAdmissions,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
