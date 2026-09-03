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
  isVerified?: boolean;
  createdAt: string;
}

export type ComplaintCategory =
  | "Injured Dog"
  | "Sick Dog"
  | "Aggressive Dog"
  | "Abandoned Puppy"
  | "Emergency Rescue"
  | "Sterilization Request"
  | "Vaccination Request"
  | "Lost Dog"
  | "Dog Bite";

export type ServiceType =
  | "Rescue"
  | "Medical"
  | "Emergency"
  | "ABC"
  | "Vaccination"
  | "Tracking";

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
  requiredService?: ServiceType;
  dogCondition: string[];
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
  geoPoint?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
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
  distanceKm?: number;
  autoAssigned?: boolean;
  matchedDogId?: string; // Linked National Dog Registry ID
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
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  latitude?: number;
  longitude?: number;
  coverageRadiusKm: number;
  servicesOffered: ServiceType[];
  workingHours: string;
  emergency24x7: boolean;
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

// ==========================================
// PHASE 3: NATIONAL DOG REGISTRY & AI TYPES
// ==========================================

export type VaccinationStatus =
  | "Fully Vaccinated"
  | "Partially Vaccinated"
  | "Not Vaccinated"
  | "Due Soon";

export type SterilizationStatus =
  | "Sterilized (Ear Notched)"
  | "Unsterilized"
  | "Scheduled";

export type AdoptionStatus =
  | "Available for Adoption"
  | "In Foster Care"
  | "Community Dog (Free Roaming)"
  | "Adopted";

export interface VaccinationRecord {
  id: string;
  vaccineType: "Anti-Rabies (ARV)" | "7-in-1 (DHPPIL)" | "Corona" | "Booster Dose";
  administeredDate: string;
  nextDueDate: string;
  administeredBy: string;
  batchNumber?: string;
  certificateUrl?: string;
}

export interface SterilizationRecord {
  id: string;
  surgeryDate: string;
  earNotchSide: "Left Ear" | "Right Ear" | "V-Shape" | "None";
  earNotchPhoto?: string;
  operatingNgo: string;
  veterinarySurgeon: string;
  recoveryStatus: "Fully Recovered" | "Post-Op Care" | "Complications";
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatmentDate: string;
  treatments: string[];
  medications: string[];
  attendingVet: string;
  vetNotes?: string;
  recoveryStatus: "Under Treatment" | "Recovering" | "Fully Healed" | "Chronic";
}

export interface RescueHistoryItem {
  complaintId: string;
  trackingId: string;
  date: string;
  category: string;
  description: string;
  status: string;
  ngoName: string;
}

export interface DogProfile {
  id: string;
  dogId: string; // e.g. "DOG-0023", "DOG-IND-8912"
  name?: string;
  images: string[];
  breed: string; // e.g. "Indian Pariah / Indie", "Labrador Mix", "Desi Stray"
  gender: "Male" | "Female" | "Unknown";
  estimatedAge: string; // e.g. "2.5 Years", "Puppy (4 Months)"
  colorPattern: string; // e.g. "Tan / Light Brown with White Chest"
  vaccinationStatus: VaccinationStatus;
  sterilizationStatus: SterilizationStatus;
  adoptionStatus: AdoptionStatus;
  currentArea: string;
  city: string;
  pincode: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  geoPoint?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  lastSeenDate: string;
  registeredByNgoId?: string;
  registeredByNgoName?: string;
  microchipNumber?: string;
  rescueHistory: RescueHistoryItem[];
  medicalHistory: MedicalRecord[];
  vaccinations: VaccinationRecord[];
  sterilization?: SterilizationRecord;
  caretakersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIMatchCandidate {
  dog: DogProfile;
  similarityScore: number; // 0 to 100 (e.g. 94)
  confidence: "High" | "Medium" | "Low";
  matchingFeatures: string[];
}

export interface GovernmentAnalytics {
  totalRegisteredDogs: number;
  vaccinatedDogsCount: number;
  vaccinationCoveragePercent: number;
  sterilizedDogsCount: number;
  sterilizationCoveragePercent: number;
  activeStrayCases: number;
  adoptedDogsCount: number;
  districtStats: {
    district: string;
    dogCount: number;
    vaccinatedPercent: number;
    sterilizedPercent: number;
    hotspotLevel: "Low" | "Moderate" | "High";
  }[];
  densityHeatmapPoints: {
    latitude: number;
    longitude: number;
    intensity: number;
    area: string;
  }[];
}
