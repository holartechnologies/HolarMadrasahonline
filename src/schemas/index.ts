import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  adminUsername: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminFullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const studentSchema = z.object({
  admissionNumber: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  otherName: z.string().optional(),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string(),
  passportPhoto: z.string().optional(),
  parentName: z.string().min(1, "Parent name is required"),
  parentPhone: z.string().min(1, "Parent phone is required"),
  parentEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  classId: z.string().optional(),
  status: z.string(),
});

export const teacherSchema = z.object({
  staffId: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  qualification: z.string().optional(),
  dateEmployed: z.string(),
  classIds: z.array(z.string()).optional(),
  subjectIds: z.array(z.string()),
});

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  code: z.string().min(1, "Class code is required"),
  teacherId: z.string().optional(),
  status: z.string(),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
});

export const attendanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  classId: z.string().min(1, "Class is required"),
  date: z.string(),
  status: z.enum(["Present", "Absent", "Late", "Excused"]),
  remarks: z.string().optional(),
});

export const examSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  term: z.string().min(1, "Term is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  startDate: z.string(),
  endDate: z.string(),
});

export const examResultSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  studentId: z.string().min(1, "Student is required"),
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  test1: z.coerce.number().min(0).max(10),
  test2: z.coerce.number().min(0).max(10),
  assignment: z.coerce.number().min(0).max(10),
  examination: z.coerce.number().min(0).max(70),
});

export const hifzRecordSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  classId: z.string().min(1, "Class is required"),
  currentJuz: z.coerce.number().min(1).max(30),
  currentSurah: z.coerce.number().min(1).max(114),
  sabak: z.string().optional(),
  sabqi: z.string().optional(),
  manzil: z.string().optional(),
  memorizationPercent: z.coerce.number().min(0).max(100),
  teacherRemarks: z.string().optional(),
});

export const characterAssessmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  discipline: z.enum(["Excellent", "Very Good", "Good", "Fair", "Poor"]),
  punctuality: z.enum(["Excellent", "Very Good", "Good", "Fair", "Poor"]),
  respect: z.enum(["Excellent", "Very Good", "Good", "Fair", "Poor"]),
  akhlaq: z.enum(["Excellent", "Very Good", "Good", "Fair", "Poor"]),
  leadership: z.enum(["Excellent", "Very Good", "Good", "Fair", "Poor"]),
  cleanliness: z.enum(["Excellent", "Very Good", "Good", "Fair", "Poor"]),
  teacherRemarks: z.string().optional(),
});

export const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

export const paymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeId: z.string().min(1, "Fee is required"),
  amountPaid: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string(),
  notes: z.string().optional(),
});

export const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  roleId: z.string().min(1, "Role is required"),
});

export const settingsSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  description: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type TeacherInput = z.infer<typeof teacherSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type ExamResultInput = z.infer<typeof examResultSchema>;
export type HifzRecordInput = z.infer<typeof hifzRecordSchema>;
export type CharacterAssessmentInput = z.infer<typeof characterAssessmentSchema>;
export type FeeInput = z.infer<typeof feeSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
