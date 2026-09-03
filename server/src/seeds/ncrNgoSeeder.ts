import { NGOModel } from "../models/NGO.js";
import { VolunteerModel } from "../models/Volunteer.js";
import { UserModel } from "../models/User.js";
import { ComplaintModel } from "../models/Complaint.js";
import { ServiceType } from "../types.js";
import bcrypt from "bcryptjs";

export const seedDelhiNcrNGOs = async () => {
  console.log("🌱 Checking and seeding verified Delhi-NCR NGO Shelters (Noida, Ghaziabad, Delhi)...");

  const existingNgos = await NGOModel.find();
  const existingNames = new Set(existingNgos.map((n) => n.name));

  interface SeedNGO {
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
      coordinates: [number, number];
    };
    coverageRadiusKm: number;
    servicesOffered: ServiceType[];
    workingHours: string;
    emergency24x7: boolean;
    activeVolunteersCount: number;
    totalRescued: number;
    avatarUrl: string;
    verified: boolean;
  }

  const ncrNgosData: SeedNGO[] = [
    // --- NOIDA SHELTERS ---
    {
      name: "Noida Animal Shelter",
      registrationNumber: "UP-NOI-2012-4412",
      email: "help@noidaanimalshelter.org",
      phone: "+91 98180 25251",
      address: "Near Sector 94 Flyover, Noida Expressway",
      city: "Noida",
      state: "Uttar Pradesh",
      pincodesCovered: ["201301", "201303", "201304", "201305", "201307"],
      location: {
        type: "Point" as const,
        coordinates: [77.3426, 28.5482] // [lng, lat]
      },
      coverageRadiusKm: 20,
      servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 24,
      totalRescued: 4850,
      avatarUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Save A Stray",
      registrationNumber: "UP-NOI-2016-8911",
      email: "contact@saveastraynoida.org",
      phone: "+91 98711 44552",
      address: "Sector 50 Community Park, Noida",
      city: "Noida",
      state: "Uttar Pradesh",
      pincodesCovered: ["201301", "201307", "201309", "201304"],
      location: {
        type: "Point" as const,
        coordinates: [77.3685, 28.5721]
      },
      coverageRadiusKm: 10,
      servicesOffered: ["Rescue", "Medical", "ABC", "Vaccination", "Tracking"],
      workingHours: "08:00 AM - 09:00 PM",
      emergency24x7: false,
      activeVolunteersCount: 16,
      totalRescued: 2120,
      avatarUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Hope 4 Speechless Souls",
      registrationNumber: "UP-NOI-2018-6701",
      email: "rescue@hope4speechless.org",
      phone: "+91 99100 88234",
      address: "Jaypee Wish Town, Sector 128, Noida",
      city: "Noida",
      state: "Uttar Pradesh",
      pincodesCovered: ["201304", "201305", "201310", "201301"],
      location: {
        type: "Point" as const,
        coordinates: [77.3812, 28.5173]
      },
      coverageRadiusKm: 15,
      servicesOffered: ["Rescue", "Emergency", "Medical", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 19,
      totalRescued: 1840,
      avatarUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Nishabd Animal Shelter",
      registrationNumber: "UP-NOI-2015-3210",
      email: "info@nishabd.org",
      phone: "+91 98118 76543",
      address: "Wazidpur Village, Sector 135, Noida Expressway",
      city: "Noida",
      state: "Uttar Pradesh",
      pincodesCovered: ["201304", "201305", "201306", "201310"],
      location: {
        type: "Point" as const,
        coordinates: [77.4082, 28.5024]
      },
      coverageRadiusKm: 25,
      servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 28,
      totalRescued: 5600,
      avatarUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "House of Stray Animals (HSA)",
      registrationNumber: "UP-NOI-2014-9981",
      email: "care@houseofstrayanimals.org",
      phone: "+91 98188 33412",
      address: "C-Block, Sector 54, Noida",
      city: "Noida",
      state: "Uttar Pradesh",
      pincodesCovered: ["201301", "201307", "201308"],
      location: {
        type: "Point" as const,
        coordinates: [77.3553, 28.5991]
      },
      coverageRadiusKm: 10,
      servicesOffered: ["Rescue", "Medical", "ABC", "Vaccination"],
      workingHours: "07:00 AM - 10:00 PM",
      emergency24x7: false,
      activeVolunteersCount: 14,
      totalRescued: 1650,
      avatarUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=150&auto=format&fit=crop&q=80",
      verified: true
    },

    // --- GHAZIABAD SHELTERS ---
    {
      name: "People For Animals (PFA Ghaziabad)",
      registrationNumber: "UP-GZB-1998-1002",
      email: "pfaghaziabad@gmail.com",
      phone: "+91 120 278 4400",
      address: "D-Block, Kavi Nagar, Near Raj Nagar District Centre",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      pincodesCovered: ["201001", "201002", "201009", "201010", "201015"],
      location: {
        type: "Point" as const,
        coordinates: [77.4372, 28.6791]
      },
      coverageRadiusKm: 25,
      servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 30,
      totalRescued: 7200,
      avatarUrl: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "HHFA Animal Shelter",
      registrationNumber: "UP-GZB-2017-5501",
      email: "contact@hhfa.org.in",
      phone: "+91 98990 12345",
      address: "Ahinsa Khand 2, Indirapuram, Ghaziabad",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      pincodesCovered: ["201014", "201010", "201012", "201301"],
      location: {
        type: "Point" as const,
        coordinates: [77.3712, 28.6415]
      },
      coverageRadiusKm: 15,
      servicesOffered: ["Rescue", "Emergency", "Medical", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 20,
      totalRescued: 2900,
      avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Jeev Upkar Trust",
      registrationNumber: "UP-GZB-2015-7782",
      email: "jeevupkar@gmail.com",
      phone: "+91 98114 99002",
      address: "Sector 15, Vasundhara, Ghaziabad",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      pincodesCovered: ["201012", "201014", "201010"],
      location: {
        type: "Point" as const,
        coordinates: [77.3789, 28.6582]
      },
      coverageRadiusKm: 10,
      servicesOffered: ["Rescue", "Medical", "ABC", "Vaccination"],
      workingHours: "08:00 AM - 08:00 PM",
      emergency24x7: false,
      activeVolunteersCount: 12,
      totalRescued: 1450,
      avatarUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Paw in Need",
      registrationNumber: "UP-GZB-2019-3312",
      email: "help@pawinneed.org",
      phone: "+91 98730 45678",
      address: "Sector 4, Vaishali, Ghaziabad",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      pincodesCovered: ["201010", "201012", "201014", "110096"],
      location: {
        type: "Point" as const,
        coordinates: [77.3421, 28.6433]
      },
      coverageRadiusKm: 10,
      servicesOffered: ["Rescue", "Emergency", "Medical", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 15,
      totalRescued: 1320,
      avatarUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
      verified: true
    },

    // --- DELHI SHELTERS ---
    {
      name: "Kalyani Animal Welfare Foundation",
      registrationNumber: "DL-SW-2011-8840",
      email: "kalyaniwelfare@gmail.com",
      phone: "+91 98110 54321",
      address: "Pocket 2, Sector B, Vasant Kunj, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      pincodesCovered: ["110070", "110067", "110037", "110021"],
      location: {
        type: "Point" as const,
        coordinates: [77.1565, 28.5244]
      },
      coverageRadiusKm: 20,
      servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 22,
      totalRescued: 3900,
      avatarUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "PRITI LOVE RESCUE FOUNDATION",
      registrationNumber: "DL-SW-2019-9114",
      email: "pritiloverescue@gmail.com",
      phone: "+91 99991 22334",
      address: "Dwarka Sector 23 / Najafgarh Road, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      pincodesCovered: ["110077", "110078", "110075", "110043"],
      location: {
        type: "Point" as const,
        coordinates: [76.9942, 28.5921]
      },
      coverageRadiusKm: 30,
      servicesOffered: ["Rescue", "Emergency", "Medical", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 25,
      totalRescued: 3400,
      avatarUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Dhyan Foundation Animal Sanctuary",
      registrationNumber: "DL-S-2008-0112",
      email: "info@dhyanfoundation.com",
      phone: "+91 99990 99990",
      address: "Fatehpur Beri, Chattarpur, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      pincodesCovered: ["110074", "110030", "110068", "122002"],
      location: {
        type: "Point" as const,
        coordinates: [77.1824, 28.5029]
      },
      coverageRadiusKm: 50,
      servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 45,
      totalRescued: 9400,
      avatarUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Friendicoes SECA India",
      registrationNumber: "DL-SE-1979-0012",
      email: "help@friendicoes.org",
      phone: "+91 11 2431 4987",
      address: "271-273 Defense Colony Flyover Market, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      pincodesCovered: ["110024", "110003", "110014", "110049", "110016"],
      location: {
        type: "Point" as const,
        coordinates: [77.2341, 28.5732]
      },
      coverageRadiusKm: 25,
      servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination", "Tracking"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 35,
      totalRescued: 12800,
      avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
      verified: true
    },
    {
      name: "Sanjay Gandhi Animal Care Centre (SGACC)",
      registrationNumber: "DL-W-1980-0044",
      email: "sgacc1980@gmail.com",
      phone: "+91 11 2544 8062",
      address: "Near Shivaji College, Raja Garden, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      pincodesCovered: ["110015", "110026", "110027", "110058"],
      location: {
        type: "Point" as const,
        coordinates: [77.1352, 28.6508]
      },
      coverageRadiusKm: 30,
      servicesOffered: ["Rescue", "Medical", "Emergency", "ABC", "Vaccination"],
      workingHours: "24/7",
      emergency24x7: true,
      activeVolunteersCount: 40,
      totalRescued: 15400,
      avatarUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=150&auto=format&fit=crop&q=80",
      verified: true
    }
  ];

  for (const ngoData of ncrNgosData) {
    if (!existingNames.has(ngoData.name)) {
      await NGOModel.create(ngoData);
      console.log(`✅ Seeded NGO: ${ngoData.name} (${ngoData.city})`);
    } else {
      // Update existing NGO with geospatial fields
      await NGOModel.updateOne({ name: ngoData.name }, { $set: ngoData });
    }
  }

  console.log("✨ Delhi-NCR NGO Shelters database seeding completed!");
};
