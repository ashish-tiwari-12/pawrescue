export type UserRole = "citizen" | "ngo_admin" | "volunteer";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  ngoId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type ComplaintCategory =
  | "Injured Dog"
  | "Sick Dog"
  | "Aggressive Dog"
  | "Abandoned Puppy"
  | "Emergency Rescue"
  | "Sterilization Request"
  | "Vaccination Request";

export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export type ComplaintStatus =
  | "Reported"
  | "Accepted"
  | "In Progress"
  | "Resolved"
  | "Closed";

export interface TimelineEvent {
  id: string;
  status: ComplaintStatus;
  title: string;
  description: string;
  timestamp: string;
  updatedBy: string;
  role: string;
  notes?: string;
}

export interface ComplaintNote {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
  isInternal?: boolean;
}

export interface Complaint {
  id: string;
  trackingId: string; // e.g. "PC-2026-8912"
  title: string;
  category: ComplaintCategory;
  dogCondition: string[]; // e.g. ["Severe Bleeding", "Limping", "Malnourished"]
  description: string;
  images: string[];
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  contactNumber: string;
  isEmergency: boolean;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  userId: string;
  citizenName: string;
  citizenPhone: string;
  ngoId?: string;
  ngoName?: string;
  volunteerId?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  timeline: TimelineEvent[];
  notes: ComplaintNote[];
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NGO {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincodesCovered: string[];
  activeVolunteersCount: number;
  totalRescued: number;
  avatarUrl?: string;
  verified: boolean;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ngoId: string;
  ngoName: string;
  skills: string[];
  availability: "Available" | "On Mission" | "Off Duty";
  assignedComplaintsCount: number;
  completedRescuesCount: number;
  avatarUrl?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "status_update" | "assignment" | "new_complaint" | "urgent_alert" | "system";
  complaintId?: string;
  trackingId?: string;
  read: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalComplaints: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  criticalCasesCount: number;
  averageResolutionHours: number;
  resolutionRatePercent: number;
  categoryCounts: Record<string, number>;
  monthlyTrends: { month: string; reported: number; resolved: number }[];
  pincodeDistribution: { area: string; count: number }[];
}
