import { Router, Request, Response } from "express";
import {
  getGeospatialLayerData,
  GeospatialLayerType
} from "../services/geospatialIntelligenceService.js";

const router = Router();

// 1. Get Layer Data by layer parameter
router.get("/layers", async (req: Request, res: Response) => {
  try {
    const layer = (req.query.layer as GeospatialLayerType) || "dog_density";
    const data = await getGeospatialLayerData(layer);
    return res.json(data);
  } catch (error: any) {
    console.error("Geospatial layer error:", error);
    return res.status(500).json({ error: "Failed to load geospatial layer data." });
  }
});

// 2. Geospatial System Summary for Map Sidebar
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const summary = {
      activeLayersCount: 7,
      supportedLayers: [
        { id: "dog_density", name: "🐕 Dog Density", subtitle: "Census & Verified Dog Clusters" },
        { id: "aggressive_risk", name: "⚠️ Aggressive Dog Risk", subtitle: "Formula: Aggressive×5 + Bite×10 + Rabies×20" },
        { id: "bite_hotspots", name: "🩸 Dog Bite Hotspots", subtitle: "Surveillance & Medical Advisories" },
        { id: "vaccination_coverage", name: "💉 Vaccination Coverage", subtitle: "ARV Immunization Rates" },
        { id: "sterilization_coverage", name: "✂️ Sterilization Coverage", subtitle: "ABC Population Stabilization" },
        { id: "ngo_coverage", name: "🏥 NGO Coverage", subtitle: "Shelter Radius & Capacity" },
        { id: "rescue_activity", name: "🚨 Live Rescue Activity", subtitle: "Real-time Operations Stream" }
      ],
      datasetSource: "Government of India Livestock Census + PawConnect India Platform Grid",
      lastUpdated: new Date().toISOString()
    };
    return res.json(summary);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to load geospatial summary." });
  }
});

export default router;
