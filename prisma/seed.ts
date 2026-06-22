import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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
  ];

  const roles: Record<string, string> = {};
  for (const data of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: data.name },
      update: { description: data.description, permissions: data.permissions },
      create: data,
    });
    roles[data.name] = role.id;
  }
  console.log("  ✓ Roles created");

  // ─── Super Admin User ──────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: adminPasswordHash,
      fullName: "Super Administrator",
      roleId: roles["Super Admin"],
    },
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      fullName: "Super Administrator",
      roleId: roles["Super Admin"],
    },
  });
  console.log("  ✓ Admin user created");

  // ─── Classes ────────────────────────────────────────────────────────────
  const classesData = [
    { name: "Tahfiz 1", code: "TAH-1" },
    { name: "Tahfiz 2", code: "TAH-2" },
    { name: "Tahfiz 3", code: "TAH-3" },
    { name: "Ibtidaiyyah 1", code: "IBT-1" },
    { name: "Ibtidaiyyah 2", code: "IBT-2" },
    { name: "I'dadiyyah 1", code: "IDA-1" },
    { name: "I'dadiyyah 2", code: "IDA-2" },
    { name: "I'dadiyyah 3", code: "IDA-3" },
    { name: "Thanawiyyah 1", code: "THA-1" },
    { name: "Thanawiyyah 2", code: "THA-2" },
    { name: "Thanawiyyah 3", code: "THA-3" },
  ];

  const classes: Record<string, string> = {};
  for (const data of classesData) {
    const cls = await prisma.class.upsert({
      where: { code: data.code },
      update: { name: data.name },
      create: data,
    });
    classes[data.code] = cls.id;
  }
  console.log("  ✓ Classes created");

  // ─── Subjects ───────────────────────────────────────────────────────────
  const subjectsData = [
    { name: "Qur'an Memorization (Hifz)", code: "QUR-MEM" },
    { name: "Tajweed", code: "TAJ" },
    { name: "Tafsir", code: "TAF" },
    { name: "Hadith Studies", code: "HAD" },
    { name: "Mustalah al-Hadith", code: "MUST-HAD" },
    { name: "Fiqh", code: "FIQH" },
    { name: "Usul al-Fiqh", code: "USUL-FIQ" },
    { name: "Aqidah", code: "AQI" },
    { name: "Sirah", code: "SIR" },
    { name: "Islamic History", code: "ISL-HIS" },
    { name: "Akhlaq", code: "AKH" },
    { name: "Da'wah and Islamic Studies", code: "DAW" },
    { name: "Arabic Language", code: "ARB-LAN" },
    { name: "Arabic Grammar (Nahw)", code: "NAHW" },
    { name: "Arabic Morphology (Sarf)", code: "SARF" },
    { name: "Arabic Literature (Adab)", code: "ADAB" },
    { name: "Islamic Inheritance Law (Fara'id)", code: "FAR" },
    { name: "Comparative Religion", code: "COM-REL" },
    { name: "Islamic Education and Civic Responsibility", code: "ISL-EDU" },
  ];

  const subjects: Record<string, string> = {};
  for (const data of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: data.code },
      update: { name: data.name },
      create: data,
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
      where: { name: data.name },
      update: { amount: data.amount, description: data.description },
      create: data,
    });
    fees[data.name] = fee.id;
  }
  console.log("  ✓ Fee structure created");

  // ─── Academic Years (Gregorian + Hijri) ──────────────────────────────────
  const academicYearsData = [
    { gregorianStart: 2022, gregorianEnd: 2023, hijriStart: 1443, hijriEnd: 1444, isCurrent: false },
    { gregorianStart: 2023, gregorianEnd: 2024, hijriStart: 1444, hijriEnd: 1445, isCurrent: false },
    { gregorianStart: 2024, gregorianEnd: 2025, hijriStart: 1445, hijriEnd: 1446, isCurrent: false },
    { gregorianStart: 2025, gregorianEnd: 2026, hijriStart: 1446, hijriEnd: 1447, isCurrent: true },
    { gregorianStart: 2026, gregorianEnd: 2027, hijriStart: 1447, hijriEnd: 1448, isCurrent: false },
    { gregorianStart: 2027, gregorianEnd: 2028, hijriStart: 1448, hijriEnd: 1449, isCurrent: false },
    { gregorianStart: 2028, gregorianEnd: 2029, hijriStart: 1449, hijriEnd: 1450, isCurrent: false },
    { gregorianStart: 2029, gregorianEnd: 2030, hijriStart: 1450, hijriEnd: 1451, isCurrent: false },
  ];

  const academicYearIds = [];
  for (const data of academicYearsData) {
    const existing = await prisma.academicYear.findFirst({
      where: { gregorianStart: data.gregorianStart, gregorianEnd: data.gregorianEnd },
    });
    if (existing) {
      await prisma.academicYear.update({
        where: { id: existing.id },
        data,
      });
      academicYearIds.push(existing.id);
    } else {
      const year = await prisma.academicYear.create({ data });
      academicYearIds.push(year.id);
    }
  }
  console.log("  ✓ Academic years created");

  // ─── System Settings ───────────────────────────────────────────────────
  const settingsData = [
    { key: "school_name", value: "Ihya'us Sunnah Islamic School" },
    { key: "school_address", value: "123 Islamic Center Road" },
    { key: "school_phone", value: "+234-800-000-0000" },
    { key: "school_email", value: "info@ihyaahussunah.edu" },
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
      where: { key: data.key },
      update: { value: data.value },
      create: data,
    });
  }
  console.log("  ✓ System settings created");

  // ─── Teacher Users (Login Accounts) ─────────────────────────────────────
  const teacherPasswordHash = await bcrypt.hash("teacher123", 12);
  const teacherUsersData = [
    {
      username: "abdullah",
      passwordHash: teacherPasswordHash,
      fullName: "Ustadh Abdullah Yusuf",
      roleName: "Teacher",
    },
    {
      username: "aisha",
      passwordHash: teacherPasswordHash,
      fullName: "Ustadhah Aisha Muhammad",
      roleName: "Teacher",
    },
  ];
  for (const data of teacherUsersData) {
    await prisma.user.upsert({
      where: { username: data.username },
      update: {
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        roleId: roles[data.roleName],
      },
      create: {
        username: data.username,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        roleId: roles[data.roleName],
      },
    });
  }
  console.log("  ✓ Teacher login accounts created");

  // ─── Teachers (Sample) ──────────────────────────────────────────────────
  const teachersData = [
    {
      staffId: "TCH-001",
      fullName: "Ustadh Abdullah Yusuf",
      phoneNumber: "+234-801-111-1111",
      email: "abdullah@ihyaahussunah.edu",
      qualification: "Masters in Islamic Studies",
      classCode: "TAH-1",
    },
    {
      staffId: "TCH-002",
      fullName: "Ustadhah Aisha Muhammad",
      phoneNumber: "+234-802-222-2222",
      email: "aisha@ihyaahussunah.edu",
      qualification: "Bachelor of Arts in Arabic",
      classCode: "IBT-1",
    },
  ];

  const teacherIds: string[] = [];
  for (const data of teachersData) {
    const teacher = await prisma.teacher.upsert({
      where: { staffId: data.staffId },
      update: {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        qualification: data.qualification,
      },
      create: {
        staffId: data.staffId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        qualification: data.qualification,
      },
    });
    // Assign teacher to class
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
    { staffId: "TCH-001", subjectCodes: ["QUR-MEM", "TAJ", "TAF"] },
    { staffId: "TCH-002", subjectCodes: ["ARB-LAN", "NAHW", "ADAB"] },
  ];

  for (const pair of subjectTeacherPairs) {
    const teacher = await prisma.teacher.findUnique({ where: { staffId: pair.staffId } });
    if (!teacher) continue;
    for (const code of pair.subjectCodes) {
      const subjectId = subjects[code];
      if (!subjectId) continue;
      await prisma.subjectTeacher.upsert({
        where: { subjectId_teacherId: { subjectId, teacherId: teacher.id } },
        update: {},
        create: { subjectId, teacherId: teacher.id },
      });
    }
  }
  console.log("  ✓ Subjects assigned to teachers");

  // ─── Students (Sample) ─────────────────────────────────────────────────
  const studentsData = [
    {
      admissionNumber: "STU-001",
      firstName: "Ibrahim",
      lastName: "Musa",
      gender: "male",
      dateOfBirth: new Date("2012-05-15"),
      parentName: "Musa Abdullahi",
      parentPhone: "+234-803-333-3331",
      parentEmail: "musa@example.com",
      address: "15 Kano Road, Kano State",
      classCode: "TAH-1",
    },
    {
      admissionNumber: "STU-002",
      firstName: "Fatima",
      lastName: "Usman",
      gender: "female",
      dateOfBirth: new Date("2013-08-22"),
      parentName: "Usman Bello",
      parentPhone: "+234-803-333-3332",
      address: "22 Zaria Street, Kaduna State",
      classCode: "TAH-1",
    },
    {
      admissionNumber: "STU-003",
      firstName: "Ahmad",
      lastName: "Sulaiman",
      gender: "male",
      dateOfBirth: new Date("2011-02-10"),
      parentName: "Sulaiman Ibrahim",
      parentPhone: "+234-803-333-3333",
      parentEmail: "sulaiman@example.com",
      address: "7 Abuja Lane, FCT Abuja",
      classCode: "IBT-1",
    },
    {
      admissionNumber: "STU-004",
      firstName: "Aisha",
      lastName: "Mahmud",
      gender: "female",
      dateOfBirth: new Date("2010-11-03"),
      parentName: "Mahmud Abubakar",
      parentPhone: "+234-803-333-3334",
      address: "45 Lagos Street, Lagos State",
      classCode: "IBT-1",
    },
    {
      admissionNumber: "STU-005",
      firstName: "Hassan",
      lastName: "Aliyu",
      gender: "male",
      dateOfBirth: new Date("2014-07-19"),
      parentName: "Aliyu Muhammad",
      parentPhone: "+234-803-333-3335",
      address: "10 Sokoto Avenue, Sokoto State",
      classCode: "TAH-2",
    },
  ];

  const studentIds: string[] = [];
  for (const data of studentsData) {
    const student = await prisma.student.upsert({
      where: { admissionNumber: data.admissionNumber },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        parentPhone: data.parentPhone,
        classId: classes[data.classCode],
      },
      create: {
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
          studentId_classId_date: {
            studentId,
            classId: student.class!.id,
            date,
          },
        },
        update: { status: attendanceStatuses[(i + day) % attendanceStatuses.length] },
        create: {
          studentId,
          classId: student.class!.id,
          date,
          status: attendanceStatuses[(i + day) % attendanceStatuses.length],
        },
      });
    }
  }
  console.log("  ✓ Sample attendance records created");

  // ─── Hifz Records (Sample) ────────────────────────────────────────────
  for (let i = 0; i < studentIds.length; i++) {
    const studentId = studentIds[i];
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { class: true } });
    if (!student?.class) continue;

    const juzProgress = [5, 3, 8, 2, 1];
    const surahProgress = [2, 1, 5, 1, 1];

    await prisma.hifzRecord.upsert({
      where: { studentId },
      update: {
        currentJuz: juzProgress[i],
        currentSurah: surahProgress[i],
        memorizationPercent: Math.round((juzProgress[i] / 30) * 100),
      },
      create: {
        studentId,
        classId: student.class!.id,
        currentJuz: juzProgress[i],
        currentSurah: surahProgress[i],
        sabak: `Juz ${juzProgress[i]} - New lesson`,
        sabqi: `Juz ${Math.max(1, juzProgress[i] - 1)} - Revision`,
        manzil: `Juz ${Math.max(1, juzProgress[i] - 2)} to Juz ${juzProgress[i]} - Overview`,
        memorizationPercent: Math.round((juzProgress[i] / 30) * 100),
        teacherRemarks: [
          "Shows good progress. Consistent practice required.",
          "Needs improvement in makharij. Regular revision recommended.",
          "Excellent memorization skills. Keep up the good work.",
          "Making steady progress. Focus on fluency.",
          "Good start. Practice daily for better retention.",
        ][i],
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

  for (let i = 0; i < studentIds.length; i++) {
    const studentId = studentIds[i];
    const vals = assessmentValues[i];

    await prisma.characterAssessment.upsert({
      where: { studentId },
      update: {
        discipline: vals[0],
        punctuality: vals[1],
        respect: vals[2],
        akhlaq: vals[3],
        leadership: vals[4],
        cleanliness: vals[5],
      },
      create: {
        studentId,
        discipline: vals[0],
        punctuality: vals[1],
        respect: vals[2],
        akhlaq: vals[3],
        leadership: vals[4],
        cleanliness: vals[5],
        teacherRemarks: [
          "A well-behaved student with strong leadership qualities.",
          "Good character overall. Should improve punctuality.",
          "Exemplary conduct. A role model for other students.",
          "Polite and respectful. Encouraged to participate more.",
          "Good manners and discipline. Consistent performance.",
        ][i],
      },
    });
  }
  console.log("  ✓ Sample character assessments created");

  // ─── Payments (Sample) ─────────────────────────────────────────────────
  const paymentSeeds = [
    { admissionNumber: "STU-001", feeName: "Tuition Fee", amountPaid: 50000, method: "Cash" },
    { admissionNumber: "STU-001", feeName: "Registration Fee", amountPaid: 10000, method: "Cash" },
    { admissionNumber: "STU-002", feeName: "Tuition Fee", amountPaid: 25000, method: "Transfer" },
    { admissionNumber: "STU-003", feeName: "Tuition Fee", amountPaid: 50000, method: "Cash" },
    { admissionNumber: "STU-003", feeName: "Examination Fee", amountPaid: 15000, method: "Cash" },
    { admissionNumber: "STU-004", feeName: "Tuition Fee", amountPaid: 50000, method: "Transfer" },
    { admissionNumber: "STU-005", feeName: "Development Levy", amountPaid: 20000, method: "Cash" },
  ];

  for (let idx = 0; idx < paymentSeeds.length; idx++) {
    const p = paymentSeeds[idx];
    const student = await prisma.student.findUnique({ where: { admissionNumber: p.admissionNumber } });
    const fee = await prisma.fee.findUnique({ where: { name: p.feeName } });
    if (!student || !fee) continue;

    const receiptNumber = `RCPT-${String(idx + 1).padStart(4, "0")}`;
    const existingPayment = await prisma.payment.findUnique({ where: { receiptNumber } });
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amountPaid: p.amountPaid,
          amount: fee.amount,
          balance: Math.max(0, fee.amount - p.amountPaid),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
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

  console.log("\n✅ Database seeding completed successfully!");
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
