import { apiRequest, type ApiResult } from "@/lib/api";
import type { Student, StudentStatus } from "@/types";

// What the backend sends: numeric ids, and the mobile number as plain 10 digits
interface ApiStudent {
  id: number;
  name: string;
  mobile: string;
  email: string;
  exam: string;
  status: StudentStatus;
  planId: number | null;
  planExpiresAt: string | null;
  registeredAt: string;
  lastLoginAt: string | null;
}

// The admin panel keeps ids as strings everywhere, shows the mobile number as "+91 9876543210",
// and calls the day of the last login "lastActiveAt"
function toStudent(student: ApiStudent): Student {
  return {
    id: String(student.id),
    name: student.name,
    email: student.email,
    phone: `+91 ${student.mobile}`,
    exam: student.exam,
    registeredAt: student.registeredAt,
    lastActiveAt: student.lastLoginAt,
    planId: student.planId === null ? null : String(student.planId),
    planExpiresAt: student.planExpiresAt,
    status: student.status,
  };
}

// What the edit form may change. mobile is the number as typed; the server cleans it.
export interface StudentChanges {
  name?: string;
  email?: string;
  mobile?: string;
  exam?: string;
  status?: StudentStatus;
  planId?: string | null;
  planExpiresAt?: string | null;
}

export async function fetchStudents(): Promise<ApiResult<Student[]>> {
  const result = await apiRequest<{ students: ApiStudent[] }>("/api/admin/students");
  return result.ok ? { ok: true, data: result.data.students.map(toStudent) } : result;
}

// Students sign up by themselves, so the admin can only change them: there is no create or delete
export async function updateStudent(id: string, changes: StudentChanges): Promise<ApiResult<Student>> {
  const result = await apiRequest<{ student: ApiStudent }>(`/api/admin/students/${id}`, { method: "PATCH", body: changes });
  return result.ok ? { ok: true, data: toStudent(result.data.student) } : result;
}
