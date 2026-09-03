import { DogProfileModel } from "../models/DogProfile.js";
import { generateVisualEmbedding } from "../services/aiMatcherService.js";

export const seedNationalDogRegistry = async () => {
  console.log("🌱 Checking and seeding National Dog Registry...");

  const existingCount = await DogProfileModel.countDocuments();
  if (existingCount > 0) {
    console.log(`ℹ️ Dog Registry already contains ${existingCount} registered dogs.`);
    return;
  }

  const sampleDogs = [
    {
      dogId: "DOG-0023",
      name: "Sheru",
      images: [
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80"
      ],
      breed: "Indian Pariah / Indie",
      gender: "Male",
      estimatedAge: "3 Years",
      colorPattern: "Golden Tan with White Chest Blaze",
      vaccinationStatus: "Fully Vaccinated",
      sterilizationStatus: "Sterilized (Ear Notched)",
      adoptionStatus: "Community Dog (Free Roaming)",
      currentArea: "Near Sector 94 Flyover, Noida Expressway",
      city: "Noida",
      pincode: "201301",
      location: { latitude: 28.5482, longitude: 77.3426 },
      geoPoint: { type: "Point", coordinates: [77.3426, 28.5482] },
      lastSeenDate: "2026-08-30",
      registeredByNgoName: "Noida Animal Shelter",
      microchipNumber: "982009182312",
      caretakersCount: 6,
      rescueHistory: [
        {
          complaintId: "c-101",
          trackingId: "PC-2026-8912",
          date: "2026-03-12",
          category: "Injured Dog",
          description: "Treated for left front paw bite laceration",
          status: "Resolved",
          ngoName: "Noida Animal Shelter"
        }
      ],
      medicalHistory: [
        {
          id: "med-1",
          diagnosis: "Superficial Paw Laceration & Minor Wound Infection",
          treatmentDate: "2026-03-12",
          treatments: ["Antiseptic Dressing", "Daily Betadine Wash"],
          medications: ["Amoxicillin 250mg (5 Days)", "Meloxicam Pain Relief"],
          attendingVet: "Dr. Arvind Sharma (MVSc)",
          vetNotes: "Clean healing, stitches removed on day 8 without complication.",
          recoveryStatus: "Fully Healed"
        }
      ],
      vaccinations: [
        {
          id: "vac-1",
          vaccineType: "Anti-Rabies (ARV)",
          administeredDate: "2026-01-15",
          nextDueDate: "2027-01-15",
          administeredBy: "Noida Animal Shelter Mobile Van",
          batchNumber: "RAB-2026-4481"
        },
        {
          id: "vac-2",
          vaccineType: "7-in-1 (DHPPIL)",
          administeredDate: "2026-01-15",
          nextDueDate: "2027-01-15",
          administeredBy: "Noida Animal Shelter",
          batchNumber: "DHPP-9902"
        }
      ],
      sterilization: {
        id: "st-1",
        surgeryDate: "2024-09-10",
        earNotchSide: "Left Ear",
        earNotchPhoto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
        operatingNgo: "Noida Animal Shelter",
        veterinarySurgeon: "Dr. Arvind Sharma",
        recoveryStatus: "Fully Recovered",
        notes: "Routine ABC castration with V-notch on left pinna."
      }
    },
    {
      dogId: "DOG-0098",
      name: "Kaalu",
      images: [
        "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80"
      ],
      breed: "Indian Pariah / Indie",
      gender: "Male",
      estimatedAge: "2 Years",
      colorPattern: "Solid Jet Black with Brown Eyebrow Spots",
      vaccinationStatus: "Fully Vaccinated",
      sterilizationStatus: "Sterilized (Ear Notched)",
      adoptionStatus: "Community Dog (Free Roaming)",
      currentArea: "Sector 50 Community Park",
      city: "Noida",
      pincode: "201301",
      location: { latitude: 28.5721, longitude: 77.3685 },
      geoPoint: { type: "Point", coordinates: [77.3685, 28.5721] },
      lastSeenDate: "2026-08-31",
      registeredByNgoName: "Save A Stray",
      caretakersCount: 4,
      rescueHistory: [],
      medicalHistory: [
        {
          id: "med-2",
          diagnosis: "Seasonal Demodectic Skin Mange (Mild Hair Loss)",
          treatmentDate: "2026-05-18",
          treatments: ["Medicated Amitraz Bath", "Topical Spray"],
          medications: ["Ivermectin Oral Drops", "Omega 3-6 Coat Supplement"],
          attendingVet: "Dr. Neha Verma",
          vetNotes: "Full fur coat regrowth achieved in 4 weeks.",
          recoveryStatus: "Fully Healed"
        }
      ],
      vaccinations: [
        {
          id: "vac-3",
          vaccineType: "Anti-Rabies (ARV)",
          administeredDate: "2026-02-10",
          nextDueDate: "2027-02-10",
          administeredBy: "Save A Stray Drive",
          batchNumber: "ARV-8812"
        }
      ],
      sterilization: {
        id: "st-2",
        surgeryDate: "2025-04-12",
        earNotchSide: "Right Ear",
        operatingNgo: "Save A Stray",
        veterinarySurgeon: "Dr. Neha Verma",
        recoveryStatus: "Fully Recovered"
      }
    },
    {
      dogId: "DOG-0141",
      name: "Rani",
      images: [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80"
      ],
      breed: "Desi Stray Mix",
      gender: "Female",
      estimatedAge: "4 Years",
      colorPattern: "Light Tan / Cream with Dark Muzzle",
      vaccinationStatus: "Fully Vaccinated",
      sterilizationStatus: "Sterilized (Ear Notched)",
      adoptionStatus: "Community Dog (Free Roaming)",
      currentArea: "Ahinsa Khand 2, Indirapuram",
      city: "Ghaziabad",
      pincode: "201014",
      location: { latitude: 28.6415, longitude: 77.3712 },
      geoPoint: { type: "Point", coordinates: [77.3712, 28.6415] },
      lastSeenDate: "2026-08-29",
      registeredByNgoName: "HHFA Animal Shelter",
      caretakersCount: 8,
      rescueHistory: [],
      medicalHistory: [],
      vaccinations: [
        {
          id: "vac-4",
          vaccineType: "Anti-Rabies (ARV)",
          administeredDate: "2026-03-01",
          nextDueDate: "2027-03-01",
          administeredBy: "HHFA Ghaziabad",
          batchNumber: "ARV-GZB-331"
        }
      ],
      sterilization: {
        id: "st-3",
        surgeryDate: "2023-11-20",
        earNotchSide: "Left Ear",
        operatingNgo: "HHFA Animal Shelter",
        veterinarySurgeon: "Dr. S. K. Gupta",
        recoveryStatus: "Fully Recovered"
      }
    },
    {
      dogId: "DOG-0056",
      name: "Bruno",
      images: [
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop&q=80"
      ],
      breed: "Labrador Indie Cross",
      gender: "Male",
      estimatedAge: "1.5 Years",
      colorPattern: "Fawn / Light Biscuit with Floppy Ears",
      vaccinationStatus: "Due Soon",
      sterilizationStatus: "Scheduled",
      adoptionStatus: "Available for Adoption",
      currentArea: "Pocket 2, Sector B, Vasant Kunj",
      city: "New Delhi",
      pincode: "110070",
      location: { latitude: 28.5244, longitude: 77.1565 },
      geoPoint: { type: "Point", coordinates: [77.1565, 28.5244] },
      lastSeenDate: "2026-08-30",
      registeredByNgoName: "Kalyani Animal Welfare Foundation",
      caretakersCount: 3,
      rescueHistory: [],
      medicalHistory: [],
      vaccinations: [
        {
          id: "vac-5",
          vaccineType: "Anti-Rabies (ARV)",
          administeredDate: "2025-09-10",
          nextDueDate: "2026-09-10",
          administeredBy: "Kalyani Welfare",
          batchNumber: "ARV-DL-991"
        }
      ]
    },
    {
      dogId: "DOG-0205",
      name: "Bella",
      images: [
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80"
      ],
      breed: "Indian Pariah / Indie",
      gender: "Female",
      estimatedAge: "2 Years",
      colorPattern: "White Base with Brown Patches over Eyes",
      vaccinationStatus: "Fully Vaccinated",
      sterilizationStatus: "Sterilized (Ear Notched)",
      adoptionStatus: "In Foster Care",
      currentArea: "Sector 4, Vaishali",
      city: "Ghaziabad",
      pincode: "201010",
      location: { latitude: 28.6433, longitude: 77.3421 },
      geoPoint: { type: "Point", coordinates: [77.3421, 28.6433] },
      lastSeenDate: "2026-08-28",
      registeredByNgoName: "Paw in Need",
      caretakersCount: 2,
      rescueHistory: [],
      medicalHistory: [],
      vaccinations: [
        {
          id: "vac-6",
          vaccineType: "Anti-Rabies (ARV)",
          administeredDate: "2026-04-05",
          nextDueDate: "2027-04-05",
          administeredBy: "Paw in Need Shelter",
          batchNumber: "ARV-VAISH-102"
        }
      ],
      sterilization: {
        id: "st-4",
        surgeryDate: "2025-08-14",
        earNotchSide: "Left Ear",
        operatingNgo: "Paw in Need",
        veterinarySurgeon: "Dr. R. K. Singh",
        recoveryStatus: "Fully Recovered"
      }
    }
  ];

  for (const dog of sampleDogs) {
    const visualEmbeddings = generateVisualEmbedding(
      dog.images[0],
      dog.breed,
      dog.colorPattern
    );
    await DogProfileModel.create({
      ...dog,
      visualEmbeddings
    } as any);
    console.log(`🐕 Seeded Dog Profile: ${dog.dogId} - ${dog.name} (${dog.city})`);
  }

  console.log("✨ National Dog Registry seeded successfully!");
};
