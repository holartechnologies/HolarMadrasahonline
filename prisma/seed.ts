import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedTenant(
  tenantId: string,
  slug: string,
  name: string,
  prefix: string
) {
  console.log(`\n--- Seeding tenant: ${name} (${slug}) ---`);

  // ─── Roles ───────────────────────────────────────────────────────────────
  const rolesData = [
    {
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
    {
      name: "Principal",
      description: "School management access",
      permissions: JSON.stringify([
        "students:read", "students:create", "students:update",
        "teachers:read", "teachers:create", "teachers:update",
        "classes:read", "classes:create", "classes:update",
        "subjects:read",
        "attendance:read",
        "exams:read", "exams:create", "exams:update",
        "results:read", "results:create", "results:update",
        "hifz:read", "hifz:create",
        "assessments:read", "assessments:create",
        "fees:read",
        "payments:read", "payments:create",
        "reports:read", "reports:export",
        "settings:read",
      ]),
    },
    {
      name: "Teacher",
      description: "Classroom management access",
      permissions: JSON.stringify([
        "students:read",
        "attendance:read", "attendance:create", "attendance:update",
        "exams:read",
        "results:read", "results:create", "results:update",
        "hifz:read", "hifz:create", "hifz:update",
        "assessments:read", "assessments:create", "assessments:update",
        "reports:read",
      ]),
    },
    {
      name: "Accountant",
      description: "Financial management access",
      permissions: JSON.stringify([
        "fees:read", "fees:create", "fees:update",
        "payments:read", "payments:create", "payments:update",
        "students:read",
        "reports:read", "reports:export",
      ]),
    },
    {
      name: "Mudeer",
      description: "School director with full administrative oversight",
      permissions: JSON.stringify([
        "users:read", "users:create", "users:update", "users:delete",
        "roles:read", "roles:create", "roles:update", "roles:delete",
        "students:read", "students:create", "students:update",
        "teachers:read", "teachers:create", "teachers:update",
        "classes:read", "classes:create", "classes:update",
        "subjects:read", "subjects:create", "subjects:update",
        "attendance:read", "attendance:create", "attendance:update",
        "exams:read", "exams:create", "exams:update",
        "results:read", "results:create", "results:update",
        "hifz:read", "hifz:create", "hifz:update",
        "assessments:read", "assessments:create", "assessments:update",
        "fees:read", "fees:create", "fees:update",
        "payments:read", "payments:create", "payments:update",
        "reports:read", "reports:export",
        "settings:read", "settings:update",
        "activity:read",
      ]),
    },
  ];

  const roles: Record<string, string> = {};
  for (const data of rolesData) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: data.name } },
      update: { description: data.description, permissions: data.permissions },
      create: { ...data, tenantId },
    });
    roles[data.name] = role.id;
  }
  console.log("  ✓ Roles created");

  // ─── Users ──────────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { tenantId_username: { tenantId, username: "admin" } },
    update: {
      passwordHash: adminPasswordHash,
      fullName: "Super Administrator",
      roleId: roles["Super Admin"],
    },
    create: {
      tenantId,
      username: "admin",
      passwordHash: adminPasswordHash,
      fullName: "Super Administrator",
      roleId: roles["Super Admin"],
    },
  });
  console.log("  ✓ Admin user created");

  const mudeerPasswordHash = await bcrypt.hash("mudeer123", 12);
  await prisma.user.upsert({
    where: { tenantId_username: { tenantId, username: "mudeer" } },
    update: {
      passwordHash: mudeerPasswordHash,
      fullName: "Mudeer (School Director)",
      roleId: roles["Mudeer"],
    },
    create: {
      tenantId,
      username: "mudeer",
      passwordHash: mudeerPasswordHash,
      fullName: "Mudeer (School Director)",
      roleId: roles["Mudeer"],
    },
  });
  console.log("  ✓ Mudeer user created");

  // ─── Classes ────────────────────────────────────────────────────────────
  const classesData = [
    { name: "Tahfiz 1", code: `${prefix}-TAH-1` },
    { name: "Tahfiz 2", code: `${prefix}-TAH-2` },
    { name: "Tahfiz 3", code: `${prefix}-TAH-3` },
    { name: "Ibtidaiyyah 1", code: `${prefix}-IBT-1` },
    { name: "Ibtidaiyyah 2", code: `${prefix}-IBT-2` },
    { name: "I'dadiyyah 1", code: `${prefix}-IDA-1` },
    { name: "I'dadiyyah 2", code: `${prefix}-IDA-2` },
    { name: "I'dadiyyah 3", code: `${prefix}-IDA-3` },
    { name: "Thanawiyyah 1", code: `${prefix}-THA-1` },
    { name: "Thanawiyyah 2", code: `${prefix}-THA-2` },
    { name: "Thanawiyyah 3", code: `${prefix}-THA-3` },
  ];

  const classes: Record<string, string> = {};
  for (const data of classesData) {
    const cls = await prisma.class.upsert({
      where: { tenantId_code: { tenantId, code: data.code } },
      update: { name: data.name },
      create: { ...data, tenantId },
    });
    classes[data.code] = cls.id;
  }
  console.log("  ✓ Classes created");

  // ─── Subjects ───────────────────────────────────────────────────────────
  const subjectsData = [
    { name: "Qur'an Memorization (Hifz)", code: `${prefix}-QUR-MEM` },
    { name: "Tajweed", code: `${prefix}-TAJ` },
    { name: "Tafsir", code: `${prefix}-TAF` },
    { name: "Hadith Studies", code: `${prefix}-HAD` },
    { name: "Mustalah al-Hadith", code: `${prefix}-MUST-HAD` },
    { name: "Fiqh", code: `${prefix}-FIQH` },
    { name: "Usul al-Fiqh", code: `${prefix}-USUL-FIQ` },
    { name: "Aqidah", code: `${prefix}-AQI` },
    { name: "Sirah", code: `${prefix}-SIR` },
    { name: "Islamic History", code: `${prefix}-ISL-HIS` },
    { name: "Akhlaq", code: `${prefix}-AKH` },
    { name: "Da'wah and Islamic Studies", code: `${prefix}-DAW` },
    { name: "Arabic Language", code: `${prefix}-ARB-LAN` },
    { name: "Arabic Grammar (Nahw)", code: `${prefix}-NAHW` },
    { name: "Arabic Morphology (Sarf)", code: `${prefix}-SARF` },
    { name: "Arabic Literature (Adab)", code: `${prefix}-ADAB` },
    { name: "Islamic Inheritance Law (Fara'id)", code: `${prefix}-FAR` },
    { name: "Comparative Religion", code: `${prefix}-COM-REL` },
    { name: "Islamic Education and Civic Responsibility", code: `${prefix}-ISL-EDU` },
  ];

  const subjects: Record<string, string> = {};
  for (const data of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { tenantId_code: { tenantId, code: data.code } },
      update: { name: data.name },
      create: { ...data, tenantId },
    });
    subjects[data.code] = subject.id;
  }
  console.log("  ✓ Subjects created");

  // ─── Fees ───────────────────────────────────────────────────────────────
  const feesData = [
    { name: "Tuition Fee", amount: 50000, description: "Standard tuition fee per term" },
    { name: "Registration Fee", amount: 10000, description: "One-time registration fee" },
    { name: "Examination Fee", amount: 15000, description: "Exam and assessment fee per term" },
    { name: "Development Levy", amount: 20000, description: "School development contribution per term" },
  ];

  const fees: Record<string, string> = {};
  for (const data of feesData) {
    const fee = await prisma.fee.upsert({
      where: { tenantId_name: { tenantId, name: data.name } },
      update: { amount: data.amount, description: data.description },
      create: { ...data, tenantId },
    });
    fees[data.name] = fee.id;
  }
  console.log("  ✓ Fee structure created");

  // ─── Academic Years ────────────────────────────────────────────────────
  const academicYearsData = [
    { gregorianStart: 2024, gregorianEnd: 2025, hijriStart: 1445, hijriEnd: 1446, isCurrent: false },
    { gregorianStart: 2025, gregorianEnd: 2026, hijriStart: 1446, hijriEnd: 1447, isCurrent: true },
    { gregorianStart: 2026, gregorianEnd: 2027, hijriStart: 1447, hijriEnd: 1448, isCurrent: false },
  ];

  for (const data of academicYearsData) {
    const existing = await prisma.academicYear.findFirst({
      where: { tenantId, gregorianStart: data.gregorianStart, gregorianEnd: data.gregorianEnd },
    });
    if (existing) {
      await prisma.academicYear.update({ where: { id: existing.id }, data });
    } else {
      await prisma.academicYear.create({ data: { ...data, tenantId } });
    }
  }
  console.log("  ✓ Academic years created");

  // ─── System Settings ───────────────────────────────────────────────────
  const settingsData = [
    { key: "school_name", value: name },
    { key: "school_address", value: "123 Islamic Center Road" },
    { key: "school_phone", value: "+234-800-000-0000" },
    { key: "school_email", value: `info@${slug}.com` },
    { key: "school_motto", value: "Reviving the Sunnah through Knowledge and Action" },
    { key: "current_academic_year", value: "2025/2026" },
    { key: "current_term", value: "1st Term" },
    { key: "exam.test1Max", value: "10", description: "Maximum marks for Test 1" },
    { key: "exam.test2Max", value: "10", description: "Maximum marks for Test 2" },
    { key: "exam.assignmentMax", value: "10", description: "Maximum marks for Assignment" },
    { key: "exam.examinationMax", value: "70", description: "Maximum marks for Examination" },
    { key: "grading_scale", value: JSON.stringify([
      { grade: "A", minPercent: 70, maxPercent: 100, remark: "Excellent" },
      { grade: "B", minPercent: 60, maxPercent: 69, remark: "Very Good" },
      { grade: "C", minPercent: 50, maxPercent: 59, remark: "Good" },
      { grade: "D", minPercent: 45, maxPercent: 49, remark: "Fair" },
      { grade: "E", minPercent: 40, maxPercent: 44, remark: "Pass" },
      { grade: "F", minPercent: 0, maxPercent: 39, remark: "Fail" },
    ]), description: "Grading scale with percentage ranges and remarks" },
  ];

  for (const data of settingsData) {
    await prisma.systemSettings.upsert({
      where: { tenantId_key: { tenantId, key: data.key } },
      update: { value: data.value },
      create: { ...data, tenantId },
    });
  }
  console.log("  ✓ System settings created");

  // ─── Teacher Users ────────────────────────────────────────────────────
  const teacherPasswordHash = await bcrypt.hash("teacher123", 12);
  const teacherUsersData = [
    {
      username: `abdullah_${slug}`,
      passwordHash: teacherPasswordHash,
      fullName: "Ustadh Abdullah Yusuf",
      roleName: "Teacher",
    },
    {
      username: `aisha_${slug}`,
      passwordHash: teacherPasswordHash,
      fullName: "Ustadhah Aisha Muhammad",
      roleName: "Teacher",
    },
  ];

  for (const data of teacherUsersData) {
    await prisma.user.upsert({
      where: { tenantId_username: { tenantId, username: data.username } },
      update: {
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        roleId: roles[data.roleName],
      },
      create: {
        tenantId,
        username: data.username,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        roleId: roles[data.roleName],
      },
    });
  }
  console.log("  ✓ Teacher login accounts created");

  // ─── Teachers (Sample) ────────────────────────────────────────────────
  const teachersData = [
    {
      staffId: `${prefix}-TCH-001`,
      fullName: "Ustadh Abdullah Yusuf",
      phoneNumber: "+234-801-111-1111",
      email: `abdullah@${slug}.com`,
      qualification: "Masters in Islamic Studies",
      classCode: `${prefix}-TAH-1`,
    },
    {
      staffId: `${prefix}-TCH-002`,
      fullName: "Ustadhah Aisha Muhammad",
      phoneNumber: "+234-802-222-2222",
      email: `aisha@${slug}.com`,
      qualification: "Bachelor of Arts in Arabic",
      classCode: `${prefix}-IBT-1`,
    },
  ];

  const teacherIds: string[] = [];
  for (const data of teachersData) {
    const teacher = await prisma.teacher.upsert({
      where: { tenantId_staffId: { tenantId, staffId: data.staffId } },
      update: {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        qualification: data.qualification,
      },
      create: {
        tenantId,
        staffId: data.staffId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        qualification: data.qualification,
      },
    });
    if (data.classCode && classes[data.classCode]) {
      await prisma.class.update({
        where: { id: classes[data.classCode] },
        data: { teacherId: teacher.id },
      });
    }
    teacherIds.push(teacher.id);
  }
  console.log("  ✓ Sample teachers created");

  // Assign subjects to teachers
  const subjectTeacherPairs = [
    { staffId: `${prefix}-TCH-001`, subjectCodes: [`${prefix}-QUR-MEM`, `${prefix}-TAJ`, `${prefix}-TAF`] },
    { staffId: `${prefix}-TCH-002`, subjectCodes: [`${prefix}-ARB-LAN`, `${prefix}-NAHW`, `${prefix}-ADAB`] },
  ];

  for (const pair of subjectTeacherPairs) {
    const teacher = await prisma.teacher.findUnique({
      where: { tenantId_staffId: { tenantId, staffId: pair.staffId } },
    });
    if (!teacher) continue;
    for (const code of pair.subjectCodes) {
      const subjectId = subjects[code];
      if (!subjectId) continue;
      await prisma.subjectTeacher.upsert({
        where: { tenantId_subjectId_teacherId: { tenantId, subjectId, teacherId: teacher.id } },
        update: {},
        create: { tenantId, subjectId, teacherId: teacher.id },
      });
    }
  }
  console.log("  ✓ Subjects assigned to teachers");

  // ─── Students (Sample) ─────────────────────────────────────────────────
  const studentsData = [
    {
      admissionNumber: `${prefix}-STU-001`,
      firstName: "Ibrahim",
      lastName: "Musa",
      gender: "male",
      dateOfBirth: new Date("2012-05-15"),
      parentName: "Musa Abdullahi",
      parentPhone: "+234-803-333-3331",
      parentEmail: "musa@example.com",
      address: "15 Kano Road",
      classCode: `${prefix}-TAH-1`,
    },
    {
      admissionNumber: `${prefix}-STU-002`,
      firstName: "Fatima",
      lastName: "Usman",
      gender: "female",
      dateOfBirth: new Date("2013-08-22"),
      parentName: "Usman Bello",
      parentPhone: "+234-803-333-3332",
      address: "22 Zaria Street",
      classCode: `${prefix}-TAH-1`,
    },
    {
      admissionNumber: `${prefix}-STU-003`,
      firstName: "Ahmad",
      lastName: "Sulaiman",
      gender: "male",
      dateOfBirth: new Date("2011-02-10"),
      parentName: "Sulaiman Ibrahim",
      parentPhone: "+234-803-333-3333",
      parentEmail: "sulaiman@example.com",
      address: "7 Abuja Lane",
      classCode: `${prefix}-IBT-1`,
    },
    {
      admissionNumber: `${prefix}-STU-004`,
      firstName: "Aisha",
      lastName: "Mahmud",
      gender: "female",
      dateOfBirth: new Date("2010-11-03"),
      parentName: "Mahmud Abubakar",
      parentPhone: "+234-803-333-3334",
      address: "45 Lagos Street",
      classCode: `${prefix}-IBT-1`,
    },
    {
      admissionNumber: `${prefix}-STU-005`,
      firstName: "Hassan",
      lastName: "Aliyu",
      gender: "male",
      dateOfBirth: new Date("2014-07-19"),
      parentName: "Aliyu Muhammad",
      parentPhone: "+234-803-333-3335",
      address: "10 Sokoto Avenue",
      classCode: `${prefix}-TAH-2`,
    },
  ];

  const studentIds: string[] = [];
  for (const data of studentsData) {
    const student = await prisma.student.upsert({
      where: { tenantId_admissionNumber: { tenantId, admissionNumber: data.admissionNumber } },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        parentPhone: data.parentPhone,
        classId: classes[data.classCode],
      },
      create: {
        tenantId,
        admissionNumber: data.admissionNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail || null,
        address: data.address,
        classId: classes[data.classCode],
      },
    });
    studentIds.push(student.id);
  }
  console.log("  ✓ Sample students created");

  // ─── Attendance Records (Sample) ───────────────────────────────────────
  const today = new Date();
  const attendanceStatuses = ["Present", "Present", "Present", "Late", "Absent"];

  for (let i = 0; i < studentIds.length; i++) {
    const studentId = studentIds[i];
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { class: true } });
    if (!student?.class) continue;

    for (let day = 0; day < 5; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      await prisma.attendance.upsert({
        where: {
          tenantId_studentId_classId_date: {
            tenantId,
            studentId,
            classId: student.class.id,
            date,
          },
        },
        update: { status: attendanceStatuses[(i + day) % attendanceStatuses.length] },
        create: {
          tenantId,
          studentId,
          classId: student.class.id,
          date,
          status: attendanceStatuses[(i + day) % attendanceStatuses.length],
        },
      });
    }
  }
  console.log("  ✓ Sample attendance records created");

  // ─── Hifz Records (Sample) ────────────────────────────────────────────
  const juzProgress = [5, 3, 8, 2, 1];
  const surahProgress = [2, 1, 5, 1, 1];
  const remarks = [
    "Shows good progress. Consistent practice required.",
    "Needs improvement in makharij. Regular revision recommended.",
    "Excellent memorization skills. Keep up the good work.",
    "Making steady progress. Focus on fluency.",
    "Good start. Practice daily for better retention.",
  ];

  for (let i = 0; i < studentIds.length; i++) {
    const studentId = studentIds[i];
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { class: true } });
    if (!student?.class) continue;

    await prisma.hifzRecord.upsert({
      where: { tenantId_studentId: { tenantId, studentId } },
      update: {
        currentJuz: juzProgress[i],
        currentSurah: surahProgress[i],
        memorizationPercent: Math.round((juzProgress[i] / 30) * 100),
      },
      create: {
        tenantId,
        studentId,
        classId: student.class.id,
        currentJuz: juzProgress[i],
        currentSurah: surahProgress[i],
        memorizationPercent: Math.round((juzProgress[i] / 30) * 100),
        teacherRemarks: remarks[i],
      },
    });
  }
  console.log("  ✓ Sample hifz records created");

  // ─── Character Assessments (Sample) ────────────────────────────────────
  const assessmentValues = [
    ["Excellent", "Very Good", "Excellent", "Very Good", "Good", "Excellent"],
    ["Very Good", "Good", "Very Good", "Good", "Good", "Very Good"],
    ["Excellent", "Excellent", "Excellent", "Excellent", "Very Good", "Excellent"],
    ["Good", "Very Good", "Good", "Very Good", "Fair", "Good"],
    ["Very Good", "Good", "Very Good", "Excellent", "Good", "Very Good"],
  ];
  const assessmentRemarks = [
    "A well-behaved student with strong leadership qualities.",
    "Good character overall. Should improve punctuality.",
    "Exemplary conduct. A role model for other students.",
    "Polite and respectful. Encouraged to participate more.",
    "Good manners and discipline. Consistent performance.",
  ];

  for (let i = 0; i < studentIds.length; i++) {
    const studentId = studentIds[i];
    const vals = assessmentValues[i];

    await prisma.characterAssessment.upsert({
      where: { tenantId_studentId: { tenantId, studentId } },
      update: {
        discipline: vals[0],
        punctuality: vals[1],
        respect: vals[2],
        akhlaq: vals[3],
        leadership: vals[4],
        cleanliness: vals[5],
      },
      create: {
        tenantId,
        studentId,
        discipline: vals[0],
        punctuality: vals[1],
        respect: vals[2],
        akhlaq: vals[3],
        leadership: vals[4],
        cleanliness: vals[5],
        teacherRemarks: assessmentRemarks[i],
      },
    });
  }
  console.log("  ✓ Sample character assessments created");

  // ─── Payments (Sample) ─────────────────────────────────────────────────
  const paymentSeeds = [
    { admissionNumber: `${prefix}-STU-001`, feeName: "Tuition Fee", amountPaid: 50000, method: "Cash" },
    { admissionNumber: `${prefix}-STU-001`, feeName: "Registration Fee", amountPaid: 10000, method: "Cash" },
    { admissionNumber: `${prefix}-STU-002`, feeName: "Tuition Fee", amountPaid: 25000, method: "Transfer" },
    { admissionNumber: `${prefix}-STU-003`, feeName: "Tuition Fee", amountPaid: 50000, method: "Cash" },
    { admissionNumber: `${prefix}-STU-003`, feeName: "Examination Fee", amountPaid: 15000, method: "Cash" },
    { admissionNumber: `${prefix}-STU-004`, feeName: "Tuition Fee", amountPaid: 50000, method: "Transfer" },
    { admissionNumber: `${prefix}-STU-005`, feeName: "Development Levy", amountPaid: 20000, method: "Cash" },
  ];

  for (let idx = 0; idx < paymentSeeds.length; idx++) {
    const p = paymentSeeds[idx];
    const student = await prisma.student.findUnique({
      where: { tenantId_admissionNumber: { tenantId, admissionNumber: p.admissionNumber } },
    });
    const fee = await prisma.fee.findUnique({
      where: { tenantId_name: { tenantId, name: p.feeName } },
    });
    if (!student || !fee) continue;

    const receiptNumber = `${prefix}-RCPT-${String(idx + 1).padStart(4, "0")}`;
    const existing = await prisma.payment.findUnique({
      where: { tenantId_receiptNumber: { tenantId, receiptNumber } },
    });
    if (existing) {
      await prisma.payment.update({
        where: { id: existing.id },
        data: {
          amountPaid: p.amountPaid,
          amount: fee.amount,
          balance: Math.max(0, fee.amount - p.amountPaid),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          tenantId,
          studentId: student.id,
          feeId: fee.id,
          amount: fee.amount,
          amountPaid: p.amountPaid,
          balance: Math.max(0, fee.amount - p.amountPaid),
          receiptNumber,
          paymentMethod: p.method,
          paymentDate: new Date(),
        },
      });
    }
  }
  console.log("  ✓ Sample payments created");
}

async function main() {
  console.log("Seeding database for multi-tenant...");

  // Create demo tenant
  const tenant = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Madrasah",
      slug: "demo",
      address: "123 Islamic Center Road",
      phone: "+234-800-000-0000",
      email: "info@demo.com",
    },
  });
  console.log(`  ✓ Organization: ${tenant.name} (${tenant.slug})`);

  await seedTenant(tenant.id, tenant.slug, tenant.name, "DEMO");

  // Optional: create a second tenant to demonstrate multi-tenancy
  const tenant2 = await prisma.organization.upsert({
    where: { slug: "al-furqan" },
    update: {},
    create: {
      name: "Madrasah Al-Furqan",
      slug: "al-furqan",
      address: "456 Knowledge Avenue",
      phone: "+234-800-111-1111",
      email: "info@alfurqan.com",
    },
  });
  console.log(`\n  ✓ Organization: ${tenant2.name} (${tenant2.slug})`);

  await seedTenant(tenant2.id, tenant2.slug, tenant2.name, "FURQAN");

  console.log("\n✅ Database seeding completed successfully!");
  console.log("\nDefault credentials per tenant:");
  console.log("  Super Admin: admin / admin123");
  console.log("  Mudeer:      mudeer / mudeer123");
  console.log("  Teacher:     abdullah_{slug} / teacher123");
  console.log("  Teacher:     aisha_{slug} / teacher123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
