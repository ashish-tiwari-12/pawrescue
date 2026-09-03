import { Router, Request, Response } from "express";
import crypto from "crypto";

const uuidv4 = () => crypto.randomUUID();
import { DogProfileModel } from "../models/DogProfile.js";
import { ComplaintModel } from "../models/Complaint.js";
import {
  matchDogImageAgainstRegistry,
  generateVisualEmbedding
} from "../services/aiMatcherService.js";
import { authenticateJWT, optionalAuth, requireRole, AuthRequest } from "../middleware/auth.js";
import { uploadImages, processUploadedImages } from "../middleware/upload.js";

const router = Router();

// Generate unique Dog ID (e.g. DOG-0482)
function generateDogId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DOG-${randomNum}`;
}

// 1. List / Search Community Dogs (MODULE 1 & MODULE 7)
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      search,
      area,
      city,
      breed,
      vaccinationStatus,
      sterilizationStatus,
      adoptionStatus,
      page = 1,
      limit = 24
    } = req.query;

    const query: any = {};

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { dogId: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { breed: { $regex: q, $options: "i" } },
        { currentArea: { $regex: q, $options: "i" } },
        { colorPattern: { $regex: q, $options: "i" } }
      ];
    }

    if (area) query.currentArea = { $regex: String(area), $options: "i" };
    if (city) query.city = { $regex: String(city), $options: "i" };
    if (breed && breed !== "All") query.breed = { $regex: String(breed), $options: "i" };
    if (vaccinationStatus && vaccinationStatus !== "All") query.vaccinationStatus = vaccinationStatus;
    if (sterilizationStatus && sterilizationStatus !== "All") query.sterilizationStatus = sterilizationStatus;
    if (adoptionStatus && adoptionStatus !== "All") query.adoptionStatus = adoptionStatus;

    const skip = (Number(page) - 1) * Number(limit);
    const [dogs, total] = await Promise.all([
      DogProfileModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DogProfileModel.countDocuments(query)
    ]);

    return res.json({
      dogs: dogs.map((d) => d.toJSON()),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    console.error("List dogs error:", error);
    return res.status(500).json({ error: "Failed to fetch dogs registry." });
  }
});

// 2. AI Visual Dog Matching Endpoint (MODULE 2)
router.post("/match", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { imageUrl, breedHint, colorHint, areaHint } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required for AI visual matching." });
    }

    const matches = await matchDogImageAgainstRegistry(
      imageUrl,
      breedHint,
      colorHint,
      areaHint
    );

    return res.json({
      queryImage: imageUrl,
      topMatches: matches
    });
  } catch (error: any) {
    console.error("AI Match error:", error);
    return res.status(500).json({ error: "Failed to perform AI dog visual matching." });
  }
});

// 3. Get Single Dog Profile by ID or DogID (MODULE 3)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let dog = await DogProfileModel.findById(id);
    if (!dog) {
      dog = await DogProfileModel.findOne({ dogId: id.toUpperCase() });
    }

    if (!dog) {
      return res.status(404).json({ error: "Dog profile not found in registry." });
    }

    return res.json({ dog: dog.toJSON() });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to get dog profile." });
  }
});

// 4. Create New Dog Profile (MODULE 1)
router.post(
  "/",
  optionalAuth,
  uploadImages.array("images", 5),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        name,
        breed = "Indian Pariah / Indie",
        gender = "Unknown",
        estimatedAge = "2 Years",
        colorPattern,
        vaccinationStatus = "Not Vaccinated",
        sterilizationStatus = "Unsterilized",
        adoptionStatus = "Community Dog (Free Roaming)",
        currentArea,
        city = "Noida",
        pincode = "201301",
        latitude,
        longitude,
        microchipNumber,
        registeredByNgoName
      } = req.body;

      if (!colorPattern || !currentArea) {
        return res.status(400).json({ error: "Color pattern and sighting area are required." });
      }

      // Collect image URLs (Uploaded directly to Cloudinary collection: pawrescue/dogs)
      const uploadedCloudinaryUrls = await processUploadedImages(req.files as any, "pawrescue/dogs");
      const imageUrls: string[] = [...uploadedCloudinaryUrls];
      if (req.body.imageUrls) {
        try {
          const parsed =
            typeof req.body.imageUrls === "string"
              ? JSON.parse(req.body.imageUrls)
              : req.body.imageUrls;
          if (Array.isArray(parsed)) imageUrls.push(...parsed);
        } catch {
          if (typeof req.body.imageUrls === "string") imageUrls.push(req.body.imageUrls);
        }
      }
      if (imageUrls.length === 0) {
        imageUrls.push(
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80"
        );
      }

      let dogId = generateDogId();
      while (await DogProfileModel.findOne({ dogId })) {
        dogId = generateDogId();
      }

      const parsedLat = latitude ? parseFloat(latitude) : 28.5482;
      const parsedLng = longitude ? parseFloat(longitude) : 77.3426;

      const visualEmbeddings = generateVisualEmbedding(imageUrls[0], breed, colorPattern);

      const newDog = await DogProfileModel.create({
        dogId,
        name: name || `Community Dog ${dogId}`,
        images: imageUrls,
        breed,
        gender,
        estimatedAge,
        colorPattern,
        vaccinationStatus,
        sterilizationStatus,
        adoptionStatus,
        currentArea,
        city,
        pincode,
        location: { latitude: parsedLat, longitude: parsedLng },
        geoPoint: { type: "Point", coordinates: [parsedLng, parsedLat] },
        lastSeenDate: new Date().toISOString().split("T")[0],
        registeredByNgoName: registeredByNgoName || "PawConnect Verified NGO",
        microchipNumber: microchipNumber || "",
        rescueHistory: [],
        medicalHistory: [],
        vaccinations: [],
        caretakersCount: 1,
        visualEmbeddings
      });

      return res.status(201).json({
        message: "Dog profile registered successfully in National Dog Registry!",
        dog: newDog.toJSON()
      });
    } catch (error: any) {
      console.error("Create dog profile error:", error);
      return res.status(500).json({ error: "Failed to register dog profile." });
    }
  }
);

// 5. Add Medical Record to Dog Profile (MODULE 4)
router.post(
  "/:id/medical",
  authenticateJWT,
  requireRole(["ngo_admin", "volunteer"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { diagnosis, treatments, medications, attendingVet, vetNotes, recoveryStatus } =
        req.body;

      if (!diagnosis || !attendingVet) {
        return res.status(400).json({ error: "Diagnosis and attending vet name are required." });
      }

      const dog = await DogProfileModel.findById(id);
      if (!dog) return res.status(404).json({ error: "Dog profile not found." });

      const newRecord = {
        id: `med-${uuidv4().slice(0, 6)}`,
        diagnosis,
        treatmentDate: new Date().toISOString().split("T")[0],
        treatments: Array.isArray(treatments) ? treatments : [treatments].filter(Boolean),
        medications: Array.isArray(medications) ? medications : [medications].filter(Boolean),
        attendingVet,
        vetNotes: vetNotes || "",
        recoveryStatus: recoveryStatus || "Under Treatment"
      };

      dog.medicalHistory.unshift(newRecord as any);
      await dog.save();

      return res.json({
        message: "Medical record logged successfully!",
        dog: dog.toJSON(),
        record: newRecord
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to add medical record." });
    }
  }
);

// 6. Record Vaccination (MODULE 5)
router.post(
  "/:id/vaccination",
  authenticateJWT,
  requireRole(["ngo_admin", "volunteer"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { vaccineType, administeredBy, nextDueDate, batchNumber } = req.body;

      if (!vaccineType || !administeredBy) {
        return res.status(400).json({ error: "Vaccine type and administrator are required." });
      }

      const dog = await DogProfileModel.findById(id);
      if (!dog) return res.status(404).json({ error: "Dog profile not found." });

      const today = new Date().toISOString().split("T")[0];
      const nextDue =
        nextDueDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const newVac = {
        id: `vac-${uuidv4().slice(0, 6)}`,
        vaccineType,
        administeredDate: today,
        nextDueDate: nextDue,
        administeredBy,
        batchNumber: batchNumber || `BATCH-${Math.floor(1000 + Math.random() * 9000)}`
      };

      dog.vaccinations.unshift(newVac as any);
      dog.vaccinationStatus = "Fully Vaccinated";
      await dog.save();

      return res.json({
        message: "Vaccination recorded successfully!",
        dog: dog.toJSON(),
        vaccination: newVac
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to record vaccination." });
    }
  }
);

// 7. Record ABC Sterilization Surgery (MODULE 6)
router.post(
  "/:id/sterilization",
  authenticateJWT,
  requireRole(["ngo_admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { operatingNgo, veterinarySurgeon, earNotchSide, recoveryStatus, notes } = req.body;

      const dog = await DogProfileModel.findById(id);
      if (!dog) return res.status(404).json({ error: "Dog profile not found." });

      dog.sterilization = {
        id: `st-${uuidv4().slice(0, 6)}`,
        surgeryDate: new Date().toISOString().split("T")[0],
        earNotchSide: earNotchSide || "Left Ear",
        operatingNgo: operatingNgo || req.user?.name || "Verified ABC Partner",
        veterinarySurgeon: veterinarySurgeon || "Dr. Staff Surgeon",
        recoveryStatus: recoveryStatus || "Fully Recovered",
        notes: notes || "Standard ABC sterilization completed."
      };
      dog.sterilizationStatus = "Sterilized (Ear Notched)";
      await dog.save();

      return res.json({
        message: "Sterilization logged successfully!",
        dog: dog.toJSON()
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to record sterilization." });
    }
  }
);

// 8. Citizen "I saw this dog today" Sighting Update (MODULE 7)
router.post("/:id/seen", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentArea, latitude, longitude } = req.body;

    const dog = await DogProfileModel.findById(id);
    if (!dog) return res.status(404).json({ error: "Dog profile not found." });

    dog.lastSeenDate = new Date().toISOString().split("T")[0];
    if (currentArea) dog.currentArea = currentArea;
    if (latitude && longitude) {
      dog.location = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      dog.geoPoint = { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] };
    }
    dog.caretakersCount = (dog.caretakersCount || 1) + 1;
    await dog.save();

    return res.json({
      message: "Thank you! Dog sighting location and date updated successfully.",
      dog: dog.toJSON()
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to record sighting." });
  }
});

export default router;
