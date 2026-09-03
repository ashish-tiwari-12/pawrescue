import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User.js";
import { ComplaintModel } from "../models/Complaint.js";
import { NGOModel } from "../models/NGO.js";
import { VolunteerModel } from "../models/Volunteer.js";
import { NotificationModel } from "../models/Notification.js";

const DEFAULT_MONGODB_URI = "mongodb://localhost:27017/pawrescue";

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  try {
    console.log("⏳ Connecting to MongoDB Atlas database 'pawrescue'...");
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB Atlas ('pawrescue')");

    // Run seed check
    await seedInitialData();
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

const seedInitialData = async () => {
  try {
    const usersCount = await UserModel.countDocuments();
    if (usersCount > 0) {
      console.log(`ℹ️ MongoDB already initialized with ${usersCount} users.`);
      return;
    }

    console.log("🌱 Database is empty. Seeding initial PawConnect India data...");

    // 1. Seed NGOs
    const seedNgos = await NGOModel.create([
      {
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
        avatarUrl:
          "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=150&auto=format&fit=crop&q=80",
        verified: true
      },
      {
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
        avatarUrl:
          "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=150&auto=format&fit=crop&q=80",
        verified: true
      },
      {
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
        avatarUrl:
          "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
        verified: true
      }
    ]);

    const vsaNgo = seedNgos[0];

    // 2. Seed Volunteers
    const seedVolunteers = await VolunteerModel.create([
      {
        name: "Rahul Sharma",
        email: "rahul.rescuer@gmail.com",
        phone: "+91 98202 33445",
        ngoId: vsaNgo._id.toString(),
        ngoName: vsaNgo.name,
        skills: ["First Aid Certified", "Catch & Handle", "Ambulance Driver"],
        availability: "Available",
        assignedComplaintsCount: 2,
        completedRescuesCount: 47,
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
      },
      {
        name: "Priya Menon",
        email: "priya.vetcare@gmail.com",
        phone: "+91 98204 77889",
        ngoId: vsaNgo._id.toString(),
        ngoName: vsaNgo.name,
        skills: ["Vet Assistant", "Puppy Foster", "Sterilization Drive"],
        availability: "On Mission",
        assignedComplaintsCount: 1,
        completedRescuesCount: 32,
        avatarUrl:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80"
      },
      {
        name: "Amit Patel",
        email: "amit.p@gmail.com",
        phone: "+91 98209 11223",
        ngoId: vsaNgo._id.toString(),
        ngoName: vsaNgo.name,
        skills: ["Emergency Trauma", "Night Response"],
        availability: "Available",
        assignedComplaintsCount: 0,
        completedRescuesCount: 65,
        avatarUrl:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80"
      }
    ]);

    // 3. Seed Users
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("password123", salt);

    const seedUsers = await UserModel.create([
      {
        name: "Aarav Mehta",
        email: "aarav@pawconnect.in",
        phone: "+91 98200 44556",
        password: passwordHash,
        role: "citizen",
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
      },
      {
        name: "Dr. Ananya Iyer",
        email: "admin@voiceforstrays.org",
        phone: "+91 98201 12345",
        password: passwordHash,
        role: "ngo_admin",
        ngoId: vsaNgo._id.toString(),
        avatarUrl:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
      },
      {
        name: "Rahul Sharma",
        email: "rahul.rescuer@gmail.com",
        phone: "+91 98202 33445",
        password: passwordHash,
        role: "volunteer",
        ngoId: vsaNgo._id.toString(),
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
      }
    ]);

    const citizenUser = seedUsers[0];

    // 4. Seed Complaints
    await ComplaintModel.create([
      {
        trackingId: "PC-2026-9812",
        title: "Injured stray dog hit by vehicle on SV Road",
        category: "Injured Dog",
        dogCondition: ["Limping", "Open Wound", "Needs Emergency Aid"],
        description:
          "Medium-sized brown indie dog hit by a two-wheeler. Shivering near the bus stop opposite Shoppers Stop. Left hind leg bleeding.",
        images: [
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80"
        ],
        address: "Near Shoppers Stop Bus Depot, SV Road, Andheri West",
        landmark: "Opposite Shoppers Stop Gate 2",
        city: "Mumbai",
        pincode: "400058",
        location: { latitude: 19.1197, longitude: 72.8468 },
        contactNumber: "+91 98200 44556",
        isEmergency: true,
        priority: "Critical",
        status: "In Progress",
        userId: citizenUser._id.toString(),
        citizenName: "Aarav Mehta",
        citizenPhone: "+91 98200 44556",
        ngoId: vsaNgo._id.toString(),
        ngoName: vsaNgo.name,
        volunteerId: seedVolunteers[0]._id.toString(),
        volunteerName: seedVolunteers[0].name,
        volunteerPhone: seedVolunteers[0].phone,
        timeline: [
          {
            id: "tl-1",
            status: "Reported",
            title: "Complaint Registered",
            description: "Emergency complaint logged with GPS location and photo evidence.",
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            updatedBy: "Aarav Mehta",
            role: "citizen"
          },
          {
            id: "tl-2",
            status: "Accepted",
            title: "NGO Accepted Complaint",
            description: "Voice for Stray Animals triage desk accepted emergency priority.",
            timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
            updatedBy: "Dr. Ananya Iyer",
            role: "ngo_admin"
          },
          {
            id: "tl-3",
            status: "In Progress",
            title: "Volunteer Dispatched with Ambulance",
            description: "Rahul Sharma en route with rescue van #MH02-AB-4412. ETA 15 mins.",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            updatedBy: "Rahul Sharma",
            role: "volunteer"
          }
        ],
        notes: [
          {
            id: "nt-1",
            authorName: "Rahul Sharma",
            authorRole: "Volunteer",
            message:
              "Reached location, dog safely secured in medical crate. Transporting to VSA Shelter clinic.",
            createdAt: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      },
      {
        trackingId: "PC-2026-9815",
        title: "Litter of 4 newborn puppies abandoned in carton box",
        category: "Abandoned Puppy",
        dogCondition: ["Hypothermic", "Newborn (Eyes closed)", "Needs Mother/Formula"],
        description:
          "Cardboard box found near Lokhandwala back road garden with four 1-week old indie puppies crying in the rain. Urgently need foster care.",
        images: [
          "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80"
        ],
        address: "Lokhandwala Garden #3, Back Road, Andheri West",
        landmark: "Behind Joggers Track bench",
        city: "Mumbai",
        pincode: "400053",
        location: { latitude: 19.1412, longitude: 72.8256 },
        contactNumber: "+91 98333 11223",
        isEmergency: true,
        priority: "Critical",
        status: "Reported",
        userId: citizenUser._id.toString(),
        citizenName: "Rohan Kapoor",
        citizenPhone: "+91 98333 11223",
        timeline: [
          {
            id: "tl-201",
            status: "Reported",
            title: "Complaint Registered",
            description: "Complaint logged by citizen with photos and exact GPS pin.",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            updatedBy: "Rohan Kapoor",
            role: "citizen"
          }
        ],
        notes: []
      },
      {
        trackingId: "PC-2026-9790",
        title: "Severe Skin Mange & Infection on Community Dog",
        category: "Sick Dog",
        dogCondition: ["Hair Loss", "Severe Mange", "Scabs"],
        description:
          "Friendly community dog near Bandra Bandstand has extensive scabies/fungal infection on torso and ears. Needs medicated baths & ivermectin treatment.",
        images: [
          "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80"
        ],
        address: "Bandstand Promenade, Near Mannat Gate 1",
        landmark: "Mannat",
        city: "Mumbai",
        pincode: "400050",
        location: { latitude: 19.0434, longitude: 72.8197 },
        contactNumber: "+91 98200 44556",
        isEmergency: false,
        priority: "Medium",
        status: "Resolved",
        userId: citizenUser._id.toString(),
        citizenName: "Aarav Mehta",
        citizenPhone: "+91 98200 44556",
        ngoId: vsaNgo._id.toString(),
        ngoName: vsaNgo.name,
        volunteerId: seedVolunteers[1]._id.toString(),
        volunteerName: seedVolunteers[1].name,
        volunteerPhone: seedVolunteers[1].phone,
        timeline: [
          {
            id: "tl-301",
            status: "Reported",
            title: "Complaint Registered",
            description: "Skin infection report submitted.",
            timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
            updatedBy: "Aarav Mehta",
            role: "citizen"
          },
          {
            id: "tl-302",
            status: "Accepted",
            title: "Accepted by VSA",
            description: "Assigned to Community Animal Treatment team.",
            timestamp: new Date(Date.now() - 86400000 * 5 + 3600000).toISOString(),
            updatedBy: "Dr. Ananya Iyer",
            role: "ngo_admin"
          },
          {
            id: "tl-303",
            status: "In Progress",
            title: "Treatment Initiated on Site",
            description: "Medicated dip and spot-on treatment applied by Priya Menon.",
            timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
            updatedBy: "Priya Menon",
            role: "volunteer"
          },
          {
            id: "tl-304",
            status: "Resolved",
            title: "Fully Recovered & Discharged",
            description: "Follow-up dose given. Fur has fully regrown and dog is active & healthy.",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
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
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        resolutionNotes: "3-week therapeutic wash protocol completed. Healthy skin restored.",
        resolvedAt: new Date(Date.now() - 86400000)
      }
    ]);

    // 5. Seed Notifications
    await NotificationModel.create([
      {
        userId: citizenUser._id.toString(),
        title: "Ambulance Dispatched for Your Report",
        message: "Volunteer Rahul Sharma (VSA) is on the way for Complaint #PC-2026-9812.",
        type: "assignment",
        trackingId: "PC-2026-9812",
        read: false
      },
      {
        userId: citizenUser._id.toString(),
        title: "Complaint Resolved!",
        message:
          "Complaint #PC-2026-9790 (Skin Mange treatment) has been successfully resolved.",
        type: "status_update",
        trackingId: "PC-2026-9790",
        read: true
      }
    ]);

    console.log("✨ MongoDB initial seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};
