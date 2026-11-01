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
  /** Returned only to mobile clients (X-Client-Type: mobile); browsers use a cookie instead. */
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
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
  studentCode?: string | null;
  cohort?: string | null;
  majorSubject?: string | null;
  campus?: string | null;
  /** "Active" or "Inactive" */
  status?: string | null;
  isActive?: boolean;
  gender?: string | null;
  fatherName?: string | null;
  department?: string | null;
}

// ===== Notifications =====
// Same shape as the SignalR "ReceiveNotification" payload
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  senderName: string;
  senderRole: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
}

export interface NotificationInbox {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

// ===== Attendance =====
export interface StudentCourse {
  teacherSectionCourseId: string;
  courseId: string;
  courseName: string;
  courseCode?: string | null;
  teacherId: string;
  teacherName?: string | null;
  sectionId: string;
  sectionName: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave';

/** Normalized from the API (see api/attendance.ts): date is the day attendance was taken. */
export interface AttendanceRecord {
  attendanceId: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  courseId: string;
  courseName: string | null;
}

// ===== Marks =====
export interface ExamInfo {
  examID: string;
  title: string;
  examType: string | null;
  totalMarks: number;
  isPublished: boolean;
  examDate: string;
  teacherSectionCourseId: string;
  courseId: string;
  courseName: string;
  courseCode?: string | null;
}

/** Marks and remarks are null when the exam is not published yet (the server withholds them). */
export interface ExamResult {
  examResultId: string;
  examId: string;
  studentId: string;
  obtainMarks: number | null;
  isAbsent: boolean | null;
  remarks: string | null;
  lastUpdate: string;
  isPublished: boolean;
  exam: ExamInfo;
}

// ===== Fees =====
/** A fee challan (invoice) for one fee type and month. */
export interface FeeChallan {
  id: string;
  invoiceNum: string;
  feeTypeName: string;
  amount: number;
  discount: number;
  lateFee: number;
  netAmount: number;
  amountPaid: number;
  amountDue: number;
  ispaid: boolean;
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue' | 'Voided';
  month: string;
  year: string;
  currency: string;
  dueDate: string;
  createdAt: string;
}
