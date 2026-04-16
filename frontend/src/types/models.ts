export type AppointmentStatus = 'pending' | 'taken' | 'skipped'

export interface AppointmentRow {
  id: number
  time: string
  medication: string
  dosage: string
  status: AppointmentStatus
}

export interface DayAppointmentsStats {
  pending: number
  taken: number
  skipped: number
  total: number
}

export interface FamilyMemberIcon {
  id: number
  name: string
  icon: string
}

export interface Medication {
  id: number
  name: string
  quantity: string
  dosage?: string
  description?: string
  take_with_food?: string
}

export type MedicationSortField = 'id' | 'name' | 'dosage' | 'quantity'
export type SortOrder = 'asc' | 'desc'

export interface PaginatedMedications {
  items: Medication[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface MedicationFileMeta {
  id: number
  medication_id: number
  original_filename: string
  content_type: string
  size_bytes: number
  created_at: string
}

export interface PresignedDownload {
  url: string
  expires_in: number
}

export interface UserProfile {
  name: string
  phone: string
  sms_notifications?: boolean
}

export interface FamilyMemberApi {
  id: number
  name: string
  phone: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user_id?: number | string
  role?: string
}

export interface AdminUser {
  id: number
  phone: string
  name: string
  role: string
}

export interface HealthPayload {
  status: string
  service: string
  timestamp: string
}

export interface DetailedHealthPayload extends HealthPayload {
  components: Record<string, string>
}

export type CalendarViewType = 'day' | 'week' | 'month'

export type PeriodType = 'daily' | 'every_other_day'

export type TakeWithFood = 'before' | 'with' | 'after'
