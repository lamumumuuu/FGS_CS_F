import { Disciple, PeakInfo, CurrentUser, SectPeak, SectRole } from "@/types/sect";
import { mockDisciples, mockPeaks, mockCurrentUser, managementRoles } from "@/data/mockSect";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCurrentUser(): Promise<CurrentUser> {
  await delay(200);
  return { ...mockCurrentUser };
}

export async function getAllDisciples(): Promise<Disciple[]> {
  await delay(300);
  return [...mockDisciples].sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function getDisciplesByPeak(peak: SectPeak): Promise<Disciple[]> {
  await delay(200);
  return mockDisciples
    .filter((d) => d.peak === peak)
    .sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function getManagementDisciples(): Promise<Disciple[]> {
  await delay(200);
  return mockDisciples
    .filter((d) => managementRoles.includes(d.role))
    .sort((a, b) => {
      const roleOrder: Record<SectRole, number> = {
        宗主: 0,
        大长老: 1,
        太上长老: 2,
        荣誉长老: 3,
        长老: 4,
        弟子: 5,
      };
      return roleOrder[a.role] - roleOrder[b.role];
    });
}

export async function getAllPeaks(): Promise<PeakInfo[]> {
  await delay(200);
  return [...mockPeaks];
}

export async function searchDisciples(keyword: string): Promise<Disciple[]> {
  await delay(200);
  const kw = keyword.toLowerCase();
  return mockDisciples
    .filter(
      (d) =>
        d.name.toLowerCase().includes(kw) ||
        d.studentId.toLowerCase().includes(kw)
    )
    .sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function filterDisciplesByPeak(peak: SectPeak | "全部"): Promise<Disciple[]> {
  await delay(200);
  let result = [...mockDisciples];
  if (peak !== "全部") {
    result = result.filter((d) => d.peak === peak);
  }
  return result.sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function moveDisciplePeak(discipleId: string, newPeak: SectPeak): Promise<boolean> {
  await delay(300);
  const disciple = mockDisciples.find((d) => d.id === discipleId);
  if (disciple) {
    disciple.peak = newPeak;
    return true;
  }
  return false;
}

export async function deleteDisciple(discipleId: string): Promise<boolean> {
  await delay(300);
  const index = mockDisciples.findIndex((d) => d.id === discipleId);
  if (index > -1) {
    mockDisciples.splice(index, 1);
    return true;
  }
  return false;
}

export async function rewardDisciple(discipleId: string, amount: number): Promise<boolean> {
  await delay(300);
  const disciple = mockDisciples.find((d) => d.id === discipleId);
  return disciple !== undefined;
}

export async function addDisciple(disciple: Omit<Disciple, "id">): Promise<Disciple> {
  await delay(300);
  const newDisciple: Disciple = {
    ...disciple,
    id: String(Date.now()),
  };
  mockDisciples.push(newDisciple);
  return newDisciple;
}
