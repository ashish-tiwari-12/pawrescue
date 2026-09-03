import axios from "axios";
import { User, NGO } from "../types";

const isProd =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

const DEFAULT_PROD_API = "https://pawrescue-ebon.vercel.app/api";
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? DEFAULT_PROD_API : "http://localhost:5000/api");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach JWT token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("pawconnect_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface NGOAuthResponse {
  message: string;
  token?: string;
  user: User;
  ngo?: NGO;
  requiresVerification?: boolean;
  email?: string;
}

export interface NGORegisterPayload {
  name: string; // Admin Name
  email: string;
  phone: string;
  password: string;
  ngoName: string; // Organization Name
  registrationNumber?: string;
  city?: string;
  state?: string;
  address?: string;
  coverageRadiusKm?: number;
  servicesOffered?: string[];
}

export const ngoAuthService = {
  /**
   * NGO Login
   */
  async login(credentials: { email: string; password: string }): Promise<NGOAuthResponse> {
    try {
      const res = await apiClient.post("/ngo/auth/login", credentials);
      if (res.data.token) {
        localStorage.setItem("pawconnect_token", res.data.token);
        localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (err: any) {
      // Fallback to unified auth if dedicated is unavailable
      const fallback = await apiClient.post("/auth/login", credentials);
      if (fallback.data.token) {
        localStorage.setItem("pawconnect_token", fallback.data.token);
        localStorage.setItem("pawconnect_user", JSON.stringify(fallback.data.user));
      }
      return fallback.data;
    }
  },

  /**
   * NGO Registration
   */
  async register(payload: NGORegisterPayload): Promise<NGOAuthResponse> {
    const res = await apiClient.post("/ngo/auth/register", payload);
    if (res.data.token) {
      localStorage.setItem("pawconnect_token", res.data.token);
      localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  /**
   * Verify Email OTP
   */
  async verifyEmail(email: string, otp: string): Promise<NGOAuthResponse> {
    const res = await apiClient.post("/ngo/auth/verify-email", { email, otp });
    if (res.data.token) {
      localStorage.setItem("pawconnect_token", res.data.token);
      localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  /**
   * Request Password Reset OTP
   */
  async forgotPassword(email: string): Promise<{ message: string; email: string }> {
    const res = await apiClient.post("/ngo/auth/forgot-password", { email });
    return res.data;
  },

  /**
   * Reset Password with OTP
   */
  async resetPassword(data: { email: string; otp: string; newPassword: string }): Promise<NGOAuthResponse> {
    const res = await apiClient.post("/ngo/auth/reset-password", data);
    return res.data;
  },

  /**
   * Demo 1-Click NGO Login
   */
  async demoLogin(): Promise<NGOAuthResponse> {
    try {
      const res = await apiClient.post("/ngo/auth/demo-login");
      if (res.data.token) {
        localStorage.setItem("pawconnect_token", res.data.token);
        localStorage.setItem("pawconnect_user", JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (err) {
      try {
        const fallback = await apiClient.post("/auth/demo-login", { role: "ngo_admin" });
        if (fallback.data.token) {
          localStorage.setItem("pawconnect_token", fallback.data.token);
          localStorage.setItem("pawconnect_user", JSON.stringify(fallback.data.user));
        }
        return fallback.data;
      } catch (e) {
        // Guaranteed Instant Demo Session (Even if Backend API is offline)
        const mockNGO: NGO = {
          id: "ngo-vsa-demo",
          name: "Voice for Stray Animals (VSA)",
          registrationNumber: "DL-AWBI-2018-9482",
          email: "vsa.rescue@pawconnect.in",
          phone: "+91 98112 34567",
          address: "Plot 14, Institutional Area, Sector 32, Gurugram",
          city: "Gurugram",
          state: "Haryana",
          location: { type: "Point", coordinates: [77.0422, 28.4595] },
          pincodesCovered: ["122001", "122002", "122003"],
          coverageRadiusKm: 20,
          servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"],
          workingHours: "24/7",
          emergency24x7: true,
          activeVolunteersCount: 14,
          totalRescued: 342,
          verified: true
        };

        const mockUser: User = {
          id: "user-demo-admin",
          name: "Dr. Ananya Sharma (Triage Officer)",
          email: "ananya.sharma@vsa-rescue.org",
          phone: "+91 98112 34567",
          role: "ngo_admin",
          ngoId: mockNGO.id,
          isVerified: true,
          createdAt: new Date().toISOString()
        };

        const mockToken = "demo_jwt_token_ngo_admin_" + Date.now();
        localStorage.setItem("pawconnect_token", mockToken);
        localStorage.setItem("pawconnect_user", JSON.stringify(mockUser));

        return {
          message: "Signed in as Demo NGO Administrator",
          token: mockToken,
          user: mockUser,
          ngo: mockNGO
        };
      }
    }
  },

  /**
   * Get Authenticated NGO Profile & Stats
   */
  async getProfile(): Promise<{ user: User; ngo?: NGO; stats?: any }> {
    const res = await apiClient.get("/ngo/auth/profile");
    return res.data;
  },

  /**
   * Update NGO Profile & Operational Settings
   */
  async updateProfile(settings: Partial<NGO>): Promise<{ message: string; ngo: NGO }> {
    const res = await apiClient.put("/ngo/auth/profile", settings);
    return res.data;
  },

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem("pawconnect_token");
    localStorage.removeItem("pawconnect_user");
  },

  /**
   * Get locally cached user
   */
  getStoredUser(): User | null {
    try {
      const data = localStorage.getItem("pawconnect_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get cached JWT token
   */
  getToken(): string | null {
    return localStorage.getItem("pawconnect_token");
  }
};
