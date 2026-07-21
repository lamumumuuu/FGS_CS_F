import { Disciple, PeakInfo, CurrentUser, SectPeak, SectRole } from "@/types/sect";

export async function getCurrentUser(): Promise<CurrentUser> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function getAllDisciples(): Promise<Disciple[]> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function getDisciplesByPeak(peak: SectPeak): Promise<Disciple[]> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function getManagementDisciples(): Promise<Disciple[]> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function getAllPeaks(): Promise<PeakInfo[]> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function searchDisciples(keyword: string): Promise<Disciple[]> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function filterDisciplesByPeak(peak: SectPeak | "全部"): Promise<Disciple[]> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function moveDisciplePeak(discipleId: string, newPeak: SectPeak): Promise<boolean> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function deleteDisciple(discipleId: string): Promise<boolean> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function rewardDisciple(discipleId: string, amount: number): Promise<boolean> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}

export async function addDisciple(disciple: Omit<Disciple, "id">): Promise<Disciple> {
  throw new Error("Mock service deprecated. Use sectApi from @/app/api/client instead.");
}
