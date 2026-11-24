import type { AnalyticsData } from "@/data/analytics";
import { apiRequest, type ApiResult } from "@/lib/api";
import type { DateRange } from "@/types";

// Numbers and chart data for the Analytics screen, worked out by the server from the real students, test attempts and purchases
export async function fetchAnalytics(range: DateRange): Promise<ApiResult<AnalyticsData>> {
  const result = await apiRequest<{ analytics: AnalyticsData }>(`/api/admin/analytics?range=${range}`);
  return result.ok ? { ok: true, data: result.data.analytics } : result;
}
