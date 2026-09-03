import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Complaint, NGO, Volunteer, Notification } from "./types.js";

const DB_FILE = path.resolve("db.json");

interface DatabaseSchema {
  users: User[];
  complaints: Complaint[];
  ngos: NGO[];
  volunteers: Volunteer[];
  notifications: Notification[];
}

const SEED_NGOS: NGO[] = [
  {
    id: "ngo-1",
    name: "Voice for Stray Animals (VSA)",
    registrationNumber: "MH-MUM-2018-8742",
    email: "contact@voiceforstrays.org",
    phone: "+91 98201 12345",
    address: "Plot 42, Andheri West Link Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincodesCovered: ["400053", "400058", "400069", "400050", "400049"],
    activeVolunteersCount: 18,
    totalRescued: 1420,
    avatarUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=150&auto=format&fit=crop&q=80",
    verified: true
  },
  {
    id: "ngo-2",
    name: "Friendicoes SECA India",
    registrationNumber: "DL-ND-1979-1102",
    email: "help@friendicoes.org",
    phone: "+91 11 2431 4987",
    address: "Defense Colony Flyover Market",
    city: "New Delhi",
    state: "Delhi",
    pincodesCovered: ["110024", "110001", "110016", "110020", "110049"],
    activeVolunteersCount: 26,
    totalRescued: 3890,
    avatarUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=150&auto=format&fit=crop&q=80",
    verified: true
  },
  {
    id: "ngo-3",
    name: "Stray Relief and Animal Welfare (STRAW)",
    registrationNumber: "KA-BLR-2015-4421",
    email: "rescue@strawindia.org",
    phone: "+91 80 2554 9900",
    address: "Indiranagar 100ft Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincodesCovered: ["560038", "560001", "560075", "560008"],
    activeVolunteersCount: 14,
    totalRescued: 980,
    avatarUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
    verified: true
  }
];

const SEED_VOLUNTEERS: Volunteer[] = [
  {
    id: "vol-1",
    name: "Rahul Sharma",
    email: "rahul.rescuer@gmail.com",
    phone: "+91 98202 33445",
    ngoId: "ngo-1",
    ngoName: "Voice for Stray Animals (VSA)",
    skills: ["First Aid Certified", "Catch & Handle", "Ambulance Driver"],
    availability: "Available",
    assignedComplaintsCount: 2,
    completedRescuesCount: 47,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "vol-2",
    name: "Priya Menon",
    email: "priya.vetcare@gmail.com",
    phone: "+91 98204 77889",
    ngoId: "ngo-1",
    ngoName: "Voice for Stray Animals (VSA)",
    skills: ["Vet Assistant", "Puppy Foster", "Sterilization Drive"],
    availability: "On Mission",
    assignedComplaintsCount: 1,
    completedRescuesCount: 32,
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "vol-3",
    name: "Amit Patel",
    email: "amit.p@gmail.com",
    phone: "+91 98209 11223",
    ngoId: "ngo-1",
    ngoName: "Voice for Stray Animals (VSA)",
    skills: ["Emergency Trauma", "Night Response"],
    availability: "Available",
    assignedComplaintsCount: 0,
    completedRescuesCount: 65,
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80"
  },
  {
    id: "vol-4",
    name: "Sneha Mukherjee",
    email: "sneha.rescue@gmail.com",
    phone: "+91 98111 65432",
    ngoId: "ngo-2",
    ngoName: "Friendicoes SECA India",
    skills: ["Trauma Care", "Canine Behavior"],
    availability: "Available",
    assignedComplaintsCount: 1,
    completedRescuesCount: 29,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
  }
];

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "comp-1",
    trackingId: "PC-2026-9812",
    title: "Injured stray dog hit by vehicle on SV Road",
    category: "Injured Dog",
    dogCondition: ["Limping", "Open Wound", "Needs Emergency Aid"],
    description: "Medium-sized brown indie dog hit by a two-wheeler. Shivering near the bus stop opposite Shoppers Stop. Left hind leg bleeding.",
    images: [
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80"
    ],
    address: "Near Shoppers Stop Bus Depot, SV Road, Andheri West",
    landmark: "Opposite Shoppers Stop Gate 2",
    city: "Mumbai",
    pincode: "400058",
    location: {
      latitude: 19.1197,
      longitude: 72.8468
    },
    contactNumber: "+91 98200 44556",
    isEmergency: true,
    priority: "Critical",
    status: "In Progress",
    userId: "usr-citizen-1",
    citizenName: "Aarav Mehta",
    citizenPhone: "+91 98200 44556",
    ngoId: "ngo-1",
    ngoName: "Voice for Stray Animals (VSA)",
    volunteerId: "vol-1",
    volunteerName: "Rahul Sharma",
    volunteerPhone: "+91 98202 33445",
    timeline: [
      {
        id: "tl-1",
        status: "Reported",
        title: "Complaint Registered",
        description: "Emergency complaint logged with GPS location and photo evidence.",
        timestamp: "2026-08-31T14:30:00.000Z",
        updatedBy: "Aarav Mehta",
        role: "citizen"
      },
      {
        id: "tl-2",
        status: "Accepted",
        title: "NGO Accepted Complaint",
        description: "Voice for Stray Animals triage desk accepted emergency priority.",
        timestamp: "2026-08-31T14:38:00.000Z",
        updatedBy: "VSA Triage Admin",
        role: "ngo_admin"
      },
      {
        id: "tl-3",
        status: "In Progress",
        title: "Volunteer Dispatched with Ambulance",
        description: "Rahul Sharma en route with rescue van #MH02-AB-4412. ETA 15 mins.",
        timestamp: "2026-08-31T14:45:00.000Z",
        updatedBy: "Rahul Sharma",
        role: "volunteer"
      }
    ],
    notes: [
      {
        id: "nt-1",
        authorName: "Rahul Sharma",
        authorRole: "Volunteer",
        message: "Reached location, dog safely secured in medical crate. Transporting to VSA Shelter clinic.",
        createdAt: "2026-08-31T15:10:00.000Z"
      }
    ],
    createdAt: "2026-08-31T14:30:00.000Z",
    updatedAt: "2026-08-31T15:10:00.000Z"
  },
  {
    id: "comp-2",
    trackingId: "PC-2026-9815",
    title: "Litter of 4 newborn puppies abandoned in carton box",
    category: "Abandoned Puppy",
    dogCondition: ["Hypothermic", "Newborn (Eyes closed)", "Needs Mother/Formula"],
    description: "Cardboard box found near Lokhandwala back road garden with four 1-week old indie puppies crying in the rain. Urgently need foster care.",
    images: [
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80"
    ],
    address: "Lokhandwala Garden #3, Back Road, Andheri West",
    landmark: "Behind Joggers Track bench",
    city: "Mumbai",
    pincode: "400053",
    location: {
      latitude: 19.1412,
      longitude: 72.8256
    },
    contactNumber: "+91 98333 11223",
    isEmergency: true,
    priority: "Critical",
    status: "Reported",
    userId: "usr-citizen-2",
    citizenName: "Rohan Kapoor",
    citizenPhone: "+91 98333 11223",
    timeline: [
      {
        id: "tl-201",
        status: "Reported",
        title: "Complaint Registered",
        description: "Complaint logged by citizen with photos and exact GPS pin.",
        timestamp: "2026-08-31T16:15:00.000Z",
        updatedBy: "Rohan Kapoor",
        role: "citizen"
      }
    ],
    notes: [],
    createdAt: "2026-08-31T16:15:00.000Z",
    updatedAt: "2026-08-31T16:15:00.000Z"
  },
  {
    id: "comp-3",
    trackingId: "PC-2026-9790",
    title: "Severe Skin Mange & Infection on Community Dog",
    category: "Sick Dog",
    dogCondition: ["Hair Loss", "Severe Mange", "Scabs"],
    description: "Friendly community dog near Bandra Bandstand has extensive scabies/fungal infection on torso and ears. Needs medicated baths & ivermectin treatment.",
    images: [
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80"
    ],
    address: "Bandstand Promenade, Near Mannat Gate 1",
    landmark: "Mannat",
    city: "Mumbai",
    pincode: "400050",
    location: {
      latitude: 19.0434,
      longitude: 72.8197
    },
    contactNumber: "+91 98200 44556",
    isEmergency: false,
    priority: "Medium",
    status: "Resolved",
    userId: "usr-citizen-1",
    citizenName: "Aarav Mehta",
    citizenPhone: "+91 98200 44556",
    ngoId: "ngo-1",
    ngoName: "Voice for Stray Animals (VSA)",
    volunteerId: "vol-2",
    volunteerName: "Priya Menon",
    volunteerPhone: "+91 98204 77889",
    timeline: [
      {
        id: "tl-301",
        status: "Reported",
        title: "Complaint Registered",
        description: "Skin infection report submitted.",
        timestamp: "2026-08-25T10:00:00.000Z",
        updatedBy: "Aarav Mehta",
        role: "citizen"
      },
      {
        id: "tl-302",
        status: "Accepted",
        title: "Accepted by VSA",
        description: "Assigned to Community Animal Treatment team.",
        timestamp: "2026-08-25T11:00:00.000Z",
        updatedBy: "VSA Admin",
        role: "ngo_admin"
      },
      {
        id: "tl-303",
        status: "In Progress",
        title: "Treatment Initiated on Site",
        description: "Medicated dip and spot-on treatment applied by Priya Menon.",
        timestamp: "2026-08-25T14:30:00.000Z",
        updatedBy: "Priya Menon",
        role: "volunteer"
      },
      {
        id: "tl-304",
        status: "Resolved",
        title: "Fully Recovered & Discharged",
        description: "Follow-up dose given. Fur has fully regrown and dog is active & healthy.",
        timestamp: "2026-08-30T16:00:00.000Z",
        updatedBy: "Priya Menon",
        role: "volunteer"
      }
    ],
    notes: [
      {
        id: "nt-301",
        authorName: "Priya Menon",
        authorRole: "Volunteer",
        message: "Completed 3 rounds of weekly treatment. Dog is in excellent spirits.",
        createdAt: "2026-08-30T15:55:00.000Z"
      }
    ],
    resolutionNotes: "3-week therapeutic medicated wash protocol completed. Healthy skin restored.",
    resolvedAt: "2026-08-30T16:00:00.000Z",
    createdAt: "2026-08-25T10:00:00.000Z",
    updatedAt: "2026-08-30T16:00:00.000Z"
  },
  {
    id: "comp-4",
    trackingId: "PC-2026-9804",
    title: "Sterilization Request for 3 Community Dogs",
    category: "Sterilization Request",
    dogCondition: ["Healthy", "Unsterilized Females"],
    description: "3 female indie dogs in residential society need ABC (Animal Birth Control) surgery and anti-rabies vaccination.",
    images: [
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop&q=80"
    ],
    address: "Building 14, MHADA Colony, Four Bungalows",
    landmark: "Opposite D-Mart",
    city: "Mumbai",
    pincode: "400053",
    location: {
      latitude: 19.1298,
      longitude: 72.8288
    },
    contactNumber: "+91 97690 88776",
    isEmergency: false,
    priority: "Low",
    status: "Accepted",
    userId: "usr-citizen-3",
    citizenName: "Sunita Deshmukh",
    citizenPhone: "+91 97690 88776",
    ngoId: "ngo-1",
    ngoName: "Voice for Stray Animals (VSA)",
    timeline: [
      {
        id: "tl-401",
        status: "Reported",
        title: "Sterilization Request Submitted",
        description: "Citizen logged sterilization request for 3 dogs.",
        timestamp: "2026-08-30T09:00:00.000Z",
        updatedBy: "Sunita Deshmukh",
        role: "citizen"
      },
      {
        id: "tl-402",
        status: "Accepted",
        title: "Scheduled for Catch & Spay",
        description: "Scheduled for next Tuesday sterilization batch.",
        timestamp: "2026-08-30T11:30:00.000Z",
        updatedBy: "VSA Admin",
        role: "ngo_admin"
      }
    ],
    notes: [],
    createdAt: "2026-08-30T09:00:00.000Z",
    updatedAt: "2026-08-30T11:30:00.000Z"
  }
];

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    userId: "usr-citizen-1",
    title: "Ambulance Dispatched for Your Report",
    message: "Volunteer Rahul Sharma (VSA) is on the way for Complaint #PC-2026-9812.",
    type: "assignment",
    complaintId: "comp-1",
    trackingId: "PC-2026-9812",
    read: false,
    createdAt: "2026-08-31T14:45:00.000Z"
  },
  {
    id: "notif-2",
    userId: "usr-citizen-1",
    title: "Complaint Resolved!",
    message: "Complaint #PC-2026-9790 (Skin Mange treatment) has been successfully resolved.",
    type: "status_update",
    complaintId: "comp-3",
    trackingId: "PC-2026-9790",
    read: true,
    createdAt: "2026-08-30T16:00:00.000Z"
  },
  {
    id: "notif-3",
    userId: "usr-ngo-admin-1",
    title: "CRITICAL: Abandoned Puppies Reported",
    message: "New emergency complaint #PC-2026-9815 reported in Lokhandwala (400053).",
    type: "urgent_alert",
    complaintId: "comp-2",
    trackingId: "PC-2026-9815",
    read: false,
    createdAt: "2026-08-31T16:15:00.000Z"
  }
];

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = this.createSeedData();
      this.persist(initialData);
      return initialData;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed.complaints || !parsed.users) {
        const initialData = this.createSeedData();
        this.persist(initialData);
        return initialData;
      }
      return parsed;
    } catch (e) {
      console.error("Error reading db.json, generating fresh seed data:", e);
      const initialData = this.createSeedData();
      this.persist(initialData);
      return initialData;
    }
  }

  private createSeedData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("password123", salt);

    const users: User[] = [
      {
        id: "usr-citizen-1",
        name: "Aarav Mehta",
        email: "aarav@pawconnect.in",
        phone: "+91 98200 44556",
        password: passwordHash,
        role: "citizen",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        createdAt: "2026-08-01T10:00:00.000Z"
      },
      {
        id: "usr-citizen-2",
        name: "Rohan Kapoor",
        email: "rohan@pawconnect.in",
        phone: "+91 98333 11223",
        password: passwordHash,
        role: "citizen",
        avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
        createdAt: "2026-08-10T10:00:00.000Z"
      },
      {
        id: "usr-citizen-3",
        name: "Sunita Deshmukh",
        email: "sunita@pawconnect.in",
        phone: "+91 97690 88776",
        password: passwordHash,
        role: "citizen",
        avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
        createdAt: "2026-08-15T10:00:00.000Z"
      },
      {
        id: "usr-ngo-admin-1",
        name: "Dr. Ananya Iyer",
        email: "admin@voiceforstrays.org",
        phone: "+91 98201 12345",
        password: passwordHash,
        role: "ngo_admin",
        ngoId: "ngo-1",
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
        createdAt: "2026-07-01T10:00:00.000Z"
      },
      {
        id: "usr-vol-1",
        name: "Rahul Sharma",
        email: "rahul.rescuer@gmail.com",
        phone: "+91 98202 33445",
        password: passwordHash,
        role: "volunteer",
        ngoId: "ngo-1",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        createdAt: "2026-07-05T10:00:00.000Z"
      }
    ];

    return {
      users,
      complaints: SEED_COMPLAINTS,
      ngos: SEED_NGOS,
      volunteers: SEED_VOLUNTEERS,
      notifications: SEED_NOTIFICATIONS
    };
  }

  private persist(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  private save() {
    this.persist(this.data);
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // Complaints
  getComplaints(): Complaint[] {
    return this.data.complaints;
  }

  getComplaintById(id: string): Complaint | undefined {
    return this.data.complaints.find((c) => c.id === id);
  }

  getComplaintByTrackingId(trackingId: string): Complaint | undefined {
    const clean = trackingId.trim().toUpperCase();
    return this.data.complaints.find(
      (c) => c.trackingId.toUpperCase() === clean || c.id === trackingId || c.contactNumber.includes(clean)
    );
  }

  createComplaint(complaint: Complaint): Complaint {
    this.data.complaints.unshift(complaint);
    this.save();
    return complaint;
  }

  updateComplaint(id: string, updates: Partial<Complaint>): Complaint | undefined {
    const idx = this.data.complaints.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.complaints[idx] = {
      ...this.data.complaints[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.complaints[idx];
  }

  deleteComplaint(id: string): boolean {
    const initialLen = this.data.complaints.length;
    this.data.complaints = this.data.complaints.filter((c) => c.id !== id);
    if (this.data.complaints.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // NGOs
  getNGOs(): NGO[] {
    return this.data.ngos;
  }

  getNGOById(id: string): NGO | undefined {
    return this.data.ngos.find((n) => n.id === id);
  }

  // Volunteers
  getVolunteers(ngoId?: string): Volunteer[] {
    if (ngoId) {
      return this.data.volunteers.filter((v) => v.ngoId === ngoId);
    }
    return this.data.volunteers;
  }

  getVolunteerById(id: string): Volunteer | undefined {
    return this.data.volunteers.find((v) => v.id === id);
  }

  createVolunteer(volunteer: Volunteer): Volunteer {
    this.data.volunteers.push(volunteer);
    this.save();
    return volunteer;
  }

  updateVolunteer(id: string, updates: Partial<Volunteer>): Volunteer | undefined {
    const idx = this.data.volunteers.findIndex((v) => v.id === id);
    if (idx === -1) return undefined;
    this.data.volunteers[idx] = { ...this.data.volunteers[idx], ...updates };
    this.save();
    return this.data.volunteers[idx];
  }

  // Notifications
  getNotifications(userId?: string): Notification[] {
    if (userId) {
      return this.data.notifications.filter((n) => n.userId === userId || n.userId === "all");
    }
    return this.data.notifications;
  }

  createNotification(notif: Notification): Notification {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string): void {
    this.data.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === "all") {
        n.read = true;
      }
    });
    this.save();
  }
}

export const db = new Database();
