// ===== Auth =====
export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: UserDto;
}

// ===== Student (Home screen) =====
// Fields beyond the sample JSON (batch, majorSubject, campus, status,
// gender, fatherName) are marked optional since the sample response
// in the requirements doc didn't include them — the UI shows "N/A"
// for anything the backend doesn't send.
export interface StudentProfile {
  studentId: string;
  userId: string;
  fullName: string;
  email: string;
  section?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  enrollmentDate?: string | null;
  cnic?: string | null;
  batch?: string | null;
  majorSubject?: string | null;
  campus?: string | null;
  status?: string | null;
  gender?: string | null;
  fatherName?: string | null;
}

// ===== Attendance =====
export interface StudentCourse {
  teacherSectionCourseId: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  sectionId: string;
  sectionName: string;
}

export interface AttendanceRecord {
  attendanceId?: string;
  studentId: string;
  courseId: string;
  date: string;
  status: string; // e.g. "Present" | "Absent" | "Leave"
  [key: string]: any;
}

// ===== Marks =====
export interface ExamInfo {
  examID: string;
  title: string;
  examTypeId: string;
  examType: string | null;
  totalMarks: number;
  isPublished: boolean;
  examDate: string;
  teacherSectionCourseId: string;
}

export interface ExamResult {
  examResultId: string;
  examId: string;
  exam: ExamInfo;
  studentId: string;
  obtainMarks: number;
  isAbsent: boolean;
  remarks: string;
  lastUpdate: string;
}

// ===== Fees =====
export interface FeeType {
  feeTypeId: string;
  feeCategoryId: string;
  name: string;
  amount: number;
  per: string;
  academicTerm: string;
  currency: string;
  applicableDate: string;
  isActive: boolean;
}

// Backend uses 0 = Unpaid, 1 = Paid
export type InvoiceStatus = 0 | 1;

export interface Invoice {
  afId: string;
  studentId: string;
  feeTypeId: string;
  feeType: FeeType;
  status: InvoiceStatus;
  createdAt: string;
}
