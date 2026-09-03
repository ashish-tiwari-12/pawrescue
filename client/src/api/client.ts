import axios from "axios";
import {
  User,
  Complaint,
  NGO,
  Volunteer,
  Notification,
  AnalyticsSummary,
  UserRole
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiInstance = axios.create({
  baseURL: API_BASE_URL
});

// Attach JWT token automatically
apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("pawconnect_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    ngoId?: string;
  }): Promise<{ user: User; token?: string; requiresVerification?: boolean; message: string }> {
    const res = await apiInstance.post("/auth/register", data);
    if (res.data.token) {
      localStorage.setItem("pawconnect_token", res.data.token);
      localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async verifyEmail(data: {
    email: string;
    otp: string;
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await apiInstance.post("/auth/verify-email", data);
    if (res.data.token) {
      localStorage.setItem("pawconnect_token", res.data.token);
      localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async resendVerification(data: { email: string }): Promise<{ message: string }> {
    const res = await apiInstance.post("/auth/resend-verification", data);
    return res.data;
  },

  async forgotPassword(data: { email: string }): Promise<{ message: string }> {
    const res = await apiInstance.post("/auth/forgot-password", data);
    return res.data;
  },

  async resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await apiInstance.post("/auth/reset-password", data);
    return res.data;
  },

  async login(data: {
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string }> {
    const res = await apiInstance.post("/auth/login", data);
    localStorage.setItem("pawconnect_token", res.data.token);
    localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
    return res.data;
  },

  async demoLogin(role: UserRole = "citizen"): Promise<{ user: User; token: string }> {
    const res = await apiInstance.post("/auth/demo-login", { role });
    localStorage.setItem("pawconnect_token", res.data.token);
    localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await apiInstance.get("/auth/me");
    return res.data;
  },

  async updateProfile(data: Partial<User>): Promise<{ user: User }> {
    const res = await apiInstance.put("/auth/profile", data);
    localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
    return res.data;
  },

  logout(): void {
    localStorage.removeItem("pawconnect_token");
    localStorage.removeItem("pawconnect_user");
  },

  getStoredUser(): User | null {
    const raw = localStorage.getItem("pawconnect_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Complaints
  async createComplaint(formData: FormData): Promise<{ complaint: Complaint; message: string }> {
    const res = await apiInstance.post("/complaints", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return res.data;
  },

  async getComplaints(params?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    userId?: string;
    ngoId?: string;
    isEmergency?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    complaints: Complaint[];
  }> {
    const res = await apiInstance.get("/complaints", { params });
    return res.data;
  },

  async getComplaintById(id: string): Promise<{ complaint: Complaint }> {
    const res = await apiInstance.get(`/complaints/${id}`);
    return res.data;
  },

  async trackComplaint(trackingId: string): Promise<{ complaint: Complaint }> {
    const res = await apiInstance.get(`/complaints/track/${encodeURIComponent(trackingId)}`);
    return res.data;
  },

  async updateComplaintStatus(
    id: string,
    status: string,
    note?: string,
    resolutionNotes?: string
  ): Promise<{ complaint: Complaint; message: string }> {
    const res = await apiInstance.patch(`/complaints/${id}/status`, { status, note, resolutionNotes });
    return res.data;
  },

  async assignVolunteer(
    id: string,
    volunteerId: string
  ): Promise<{ complaint: Complaint; message: string }> {
    const res = await apiInstance.patch(`/complaints/${id}/assign`, { volunteerId });
    return res.data;
  },

  async addComplaintNote(
    id: string,
    message: string,
    isInternal: boolean = false
  ): Promise<{ complaint: Complaint; message: string }> {
    const res = await apiInstance.post(`/complaints/${id}/notes`, { message, isInternal });
    return res.data;
  },

  async bulkUpdateStatus(
    complaintIds: string[],
    status: string,
    note?: string
  ): Promise<{ updatedCount: number; message: string }> {
    const res = await apiInstance.post("/complaints/bulk-status", { complaintIds, status, note });
    return res.data;
  },

  // NGOs
  async getNGOs(lat?: number, lng?: number): Promise<{ ngos: NGO[] }> {
    const res = await apiInstance.get("/ngos", { params: { lat, lng } });
    return res.data;
  },

  async getNGOById(id: string): Promise<{ ngo: NGO; stats: any }> {
    const res = await apiInstance.get(`/ngos/${id}`);
    return res.data;
  },

  async updateNGOSettings(
    id: string,
    settings: {
      coverageRadiusKm?: number;
      servicesOffered?: string[];
      workingHours?: string;
      emergency24x7?: boolean;
      address?: string;
      latitude?: number;
      longitude?: number;
    }
  ): Promise<{ ngo: NGO; message: string }> {
    const res = await apiInstance.put(`/ngos/${id}/settings`, settings);
    return res.data;
  },

  // Volunteers
  async getVolunteers(ngoId?: string): Promise<{ volunteers: Volunteer[] }> {
    const res = await apiInstance.get("/volunteers", { params: { ngoId } });
    return res.data;
  },

  async createVolunteer(data: {
    name: string;
    email: string;
    phone: string;
    ngoId?: string;
    skills?: string[];
    availability?: "Available" | "On Mission" | "Off Duty";
  }): Promise<{ volunteer: Volunteer; message: string }> {
    const res = await apiInstance.post("/volunteers", data);
    return res.data;
  },

  async updateVolunteer(
    id: string,
    data: Partial<Volunteer>
  ): Promise<{ volunteer: Volunteer; message: string }> {
    const res = await apiInstance.put(`/volunteers/${id}`, data);
    return res.data;
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    const res = await apiInstance.get("/notifications");
    return res.data;
  },

  async markNotificationRead(id: string): Promise<{ message: string }> {
    const res = await apiInstance.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllNotificationsRead(): Promise<{ message: string }> {
    const res = await apiInstance.patch("/notifications/read-all");
    return res.data;
  },

  // Analytics
  async getAnalytics(ngoId?: string): Promise<AnalyticsSummary> {
    const res = await apiInstance.get("/analytics/summary", { params: { ngoId } });
    return res.data;
  }
};
