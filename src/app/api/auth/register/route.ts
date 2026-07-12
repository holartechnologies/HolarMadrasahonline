import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schoolName, slug, email, phone, address, adminUsername, adminPassword, adminFullName } = body;

    if (!schoolName || !slug || !email || !adminUsername || !adminPassword || !adminFullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingSlug = await prisma.organization.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: "This school URL is already taken" }, { status: 409 });
    }

    const tenant = await prisma.organization.create({
      data: {
        name: schoolName,
        slug,
        email,
        phone: phone || null,
        address: address || null,
      },
    });

    const superAdminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: "Super Admin",
        description: "Full system access",
        permissions: JSON.stringify([
          "users:read", "users:create", "users:update", "users:delete",
          "roles:read", "roles:create", "roles:update", "roles:delete",
          "students:read", "students:create", "students:update", "students:delete",
          "teachers:read", "teachers:create", "teachers:update", "teachers:delete",
          "classes:read", "classes:create", "classes:update", "classes:delete",
          "subjects:read", "subjects:create", "subjects:update", "subjects:delete",
          "attendance:read", "attendance:create", "attendance:update",
          "exams:read", "exams:create", "exams:update", "exams:delete",
          "results:read", "results:create", "results:update", "results:delete",
          "hifz:read", "hifz:create", "hifz:update",
          "assessments:read", "assessments:create", "assessments:update",
          "fees:read", "fees:create", "fees:update", "fees:delete",
          "payments:read", "payments:create", "payments:update",
          "reports:read", "reports:export",
          "settings:read", "settings:update",
          "activity:read",
        ]),
      },
    });

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        username: adminUsername,
        passwordHash,
        fullName: adminFullName,
        roleId: superAdminRole.id,
      },
    });

    await prisma.systemSettings.createMany({
      data: [
        { tenantId: tenant.id, key: "school_name", value: schoolName },
        { tenantId: tenant.id, key: "school_email", value: email },
        { tenantId: tenant.id, key: "school_phone", value: phone || "" },
        { tenantId: tenant.id, key: "school_address", value: address || "" },
        { tenantId: tenant.id, key: "school_motto", value: "Knowledge and Action" },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "School registered successfully. You can now sign in.",
      loginUrl: `/login`,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
