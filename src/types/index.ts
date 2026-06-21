export interface UserWithRole {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  role: {
    id: string;
    name: string;
    permissions: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentWithClass {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  gender: string;
  dateOfBirth: Date;
  passportPhoto: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  address: string;
  status: string;
  classId: string | null;
  class: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherWithRelations {
  id: string;
  staffId: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  qualification: string | null;
  dateEmployed: Date;
  classId: string | null;
  class: {
    id: string;
    name: string;
    code: string;
  } | null;
  subjects: {
    id: string;
    teacherId: string;
    subjectId: string;
    subject: {
      id: string;
      name: string;
      code: string;
      description: string | null;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassWithRelations {
  id: string;
  name: string;
  code: string;
  status: string;
  teacherId: string | null;
  teacher: {
    id: string;
    staffId: string;
    fullName: string;
  } | null;
  students: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  }[];
  subjects: {
    id: string;
    classId: string;
    subjectId: string;
    subject: {
      id: string;
      name: string;
      code: string;
      description: string | null;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectWithRelations {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  classes: {
    id: string;
    classId: string;
    subjectId: string;
    class: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  teachers: {
    id: string;
    teacherId: string;
    subjectId: string;
    teacher: {
      id: string;
      staffId: string;
      fullName: string;
    };
  }[];
}

export interface AttendanceWithStudent {
  id: string;
  studentId: string;
  classId: string;
  date: Date;
  status: string;
  remarks: string | null;
  createdAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    classId: string | null;
  };
}

export interface ExamResultWithAll {
  id: string;
  examId: string;
  studentId: string;
  classId: string;
  subjectId: string;
  test1: number;
  test2: number;
  assignment: number;
  examination: number;
  total: number;
  grade: string | null;
  createdAt: Date;
  exam: {
    id: string;
    title: string;
    term: string;
    academicYear: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  class: {
    id: string;
    name: string;
    code: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

export interface HifzRecordWithStudent {
  id: string;
  studentId: string;
  classId: string;
  currentJuz: number;
  currentSurah: number;
  sabak: string | null;
  sabqi: string | null;
  manzil: string | null;
  memorizationPercent: number;
  teacherRemarks: string | null;
  assessmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  class: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CharacterAssessmentWithStudent {
  id: string;
  studentId: string;
  discipline: string;
  punctuality: string;
  respect: string;
  akhlaq: string;
  leadership: string;
  cleanliness: string;
  teacherRemarks: string | null;
  assessmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
}

export interface PaymentWithAll {
  id: string;
  studentId: string;
  feeId: string;
  amountPaid: number;
  paymentMethod: string;
  receiptNumber: string;
  paymentDate: Date;
  notes: string | null;
  createdAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  fee: {
    id: string;
    name: string;
    amount: number;
    description: string | null;
  };
}

export interface FeeWithPayments {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  payments: {
    id: string;
    studentId: string;
    amountPaid: number;
    paymentMethod: string;
    receiptNumber: string;
    paymentDate: Date;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      admissionNumber: string;
    };
  }[];
}

export interface ActivityLogWithUser {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: {
      id: string;
      name: string;
    };
  };
}
