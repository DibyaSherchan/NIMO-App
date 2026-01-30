export interface TestCenter {
  centerId: string;
  name: string;
  city: string;
  region: 'central' | 'eastern' | 'western';
  capacity: number;
  currentLoad: number;
  address: string;
}

export interface Applicant {
  applicantId: string;
  name: string;
  city: string;
  preferredRegion?: 'central' | 'eastern' | 'western';
}

type Region = 'central' | 'eastern' | 'western';

interface RegionQuota {
  central: number;
  eastern: number;
  western: number;
}


const LOCATION_TO_REGION: Record<string, 'central' | 'eastern' | 'western'> = {
  "Kathmandu": "central", "Lalitpur": "central", "Bhaktapur": "central",
  "Bharatpur": "central", "Chitwan": "central", "Hetauda": "central",
  "Makwanpur": "central", "Dhulikhel": "central", "Kavrepalanchok": "central",
  "Banepa": "central", "Birgunj": "central", "Parsa": "central",
  "Gorkha": "central", "Sindhupalchok": "central", "Dhading": "central",
  "Dharan": "eastern", "Sunsari": "eastern", "Biratnagar": "eastern",
  "Morang": "eastern", "Birtamode": "eastern", "Bhadrapur": "eastern",
  "Damak": "eastern", "Jhapa": "eastern", "Itahari": "eastern",
  "Dhankuta": "eastern", "Ilam": "eastern", "Gaighat": "eastern",
  "Udayapur": "eastern",
  "Pokhara": "western", "Kaski": "western", "Butwal": "western",
  "Bhairahawa": "western", "Rupandehi": "western", "Tansen": "western",
  "Palpa": "western", "Syangja": "western", "Nawalparasi": "western"
};

export function hybridAllocateTestCenterWithQuota(
  applicant: Applicant,
  testCenters: TestCenter[],
  regionQuota: RegionQuota
): TestCenter {

  const availableCenters = testCenters.filter(
    c => c.currentLoad < c.capacity && regionQuota[c.region] > 0
  );

  if (availableCenters.length === 0) {
    throw new Error('No available test centers with remaining quota');
  }

  const homeRegion = LOCATION_TO_REGION[applicant.city];
  const preferredRegion = applicant.preferredRegion;
  const sameCityCenters = availableCenters.filter(
    c => c.city.toLowerCase() === applicant.city.toLowerCase()
  );
  if (sameCityCenters.length > 0) {
    return selectLeastLoadedCenter(sameCityCenters);
  }
  if (preferredRegion) {
    const preferredCenters = availableCenters.filter(
      c => c.region === preferredRegion
    );
    if (preferredCenters.length > 0) {
      return selectLeastLoadedCenter(preferredCenters);
    }
  }
  if (homeRegion) {
    const homeRegionCenters = availableCenters.filter(
      c => c.region === homeRegion
    );
    if (homeRegionCenters.length > 0) {
      return selectLeastLoadedCenter(homeRegionCenters);
    }
  }
  return selectLeastLoadedCenter(availableCenters);
}


function selectLeastLoadedCenter(centers: TestCenter[]): TestCenter {
  const centersWithLoad = centers.map(c => ({
    center: c,
    loadPercentage: (c.currentLoad / c.capacity) * 100
  }));
  centersWithLoad.sort((a, b) => a.loadPercentage - b.loadPercentage);
  return centersWithLoad[0].center;
}

export function getAllocationReason(
  applicant: Applicant,
  center: TestCenter
): string {
  const applicantRegion = LOCATION_TO_REGION[applicant.city];

  if (center.city.toLowerCase() === applicant.city.toLowerCase()) {
    return `Test center in your city (${center.city})`;
  }

  if (center.region === applicantRegion) {
    return `Nearest available center in ${center.region} region`;
  }

  if (applicant.preferredRegion && center.region === applicant.preferredRegion) {
    return `Center in your preferred ${center.region} region`;
  }
 
  return `Best available center with balanced load`;
}

export function batchHybridAllocateWithQuota(
  applicants: Applicant[],
  testCenters: TestCenter[]
) {
  const allocations = new Map();

  const centerMap = new Map<string, TestCenter>();
  testCenters.forEach(c => centerMap.set(c.centerId, { ...c }));

  const totalApplicants = applicants.length;

  const regionQuota: RegionQuota = {
    central: Math.floor(totalApplicants * 0.80),
    eastern: Math.floor(totalApplicants * 0.11),
    western: Math.floor(totalApplicants * 0.09),
  };

  const shuffledApplicants = [...applicants].sort(() => Math.random() - 0.5);

  for (const applicant of shuffledApplicants) {
    const centers = Array.from(centerMap.values());

    try {
      const center = hybridAllocateTestCenterWithQuota(
        applicant,
        centers,
        regionQuota
      );

      allocations.set(applicant.applicantId, {
        applicant,
        center,
        reason: getAllocationReason(applicant, center),
      });

      const mutableCenter = centerMap.get(center.centerId);
      if (mutableCenter) {
        mutableCenter.currentLoad += 1;
        regionQuota[mutableCenter.region] -= 1;
      }

    } catch (err) {
      console.error(`Allocation failed for ${applicant.applicantId}`, err);
    }
  }

  return allocations;
}

export function getDistributionStats(testCenters: TestCenter[]) {
  const stats = {
    overall: {
      total: testCenters.length,
      allocated: 0,
      capacity: 0,
      utilizationRate: 0
    },
    byRegion: {} as Record<string, any>,
    balanceScore: 0
  };

  testCenters.forEach(center => {
    stats.overall.allocated += center.currentLoad;
    stats.overall.capacity += center.capacity;

    if (!stats.byRegion[center.region]) {
      stats.byRegion[center.region] = {
        centers: 0,
        allocated: 0,
        capacity: 0,
        utilizationRate: 0
      };
    }

    stats.byRegion[center.region].centers += 1;
    stats.byRegion[center.region].allocated += center.currentLoad;
    stats.byRegion[center.region].capacity += center.capacity;
  });

  stats.overall.utilizationRate = (stats.overall.allocated / stats.overall.capacity) * 100;

  Object.keys(stats.byRegion).forEach(region => {
    const regionStats = stats.byRegion[region];
    regionStats.utilizationRate = (regionStats.allocated / regionStats.capacity) * 100;
  });
  const avgLoad = stats.overall.allocated / stats.overall.total;
  const variance = testCenters.reduce((sum, c) => {
    return sum + Math.pow(c.currentLoad - avgLoad, 2);
  }, 0) / testCenters.length;
  stats.balanceScore = Math.sqrt(variance);

  return stats;
}
export function getAvailableLocations(): string[] {
  return Object.keys(LOCATION_TO_REGION).sort();
}