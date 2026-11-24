import type { Request, Response } from "express";
import { DATE_RANGES, getAnalytics, type DateRange } from "../services/analytics.service";

// GET /api/admin/analytics?range=30d  (7d, 30d, 90d or 12m)  ->  numbers and chart data for the Analytics screen
export async function getAnalyticsHandler(req: Request, res: Response): Promise<void> {
  const range = typeof req.query.range === "string" ? req.query.range : "30d";
  if (!(DATE_RANGES as readonly string[]).includes(range)) {
    res.status(400).json({ success: false, message: "Range must be 7d, 30d, 90d or 12m." });
    return;
  }
  try {
    res.json({ success: true, message: "Analytics", data: { analytics: await getAnalytics(range as DateRange) } });
  } catch (error) {
    console.error("Analytics failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
