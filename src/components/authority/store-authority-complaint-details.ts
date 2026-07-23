import type { AuthorityComplaint } from './store-authority-dashboard';

export type AuthorityEvidenceImage = number | { uri: string };

export type AuthorityWorkUpdate = {
  id: string;
  title: string;
  note: string;
  timestamp: string;
  complete: boolean;
  budget: string;
  images: AuthorityEvidenceImage[];
};

export type AuthorityResidentFeedback = {
  id: string;
  resident: string;
  residentInitials: string;
  rating: number;
  comment: string;
  receivedAt: string;
};

export type AuthorityComplaintDetail = AuthorityComplaint & {
  reporter: string;
  reporterInitials: string;
  reporterPhone: string;
  submittedAt: string;
  zone: string;
  evidence: AuthorityEvidenceImage;
  deadline: string;
  budget: string;
  workNote: string;
  progress: number;
  completedAt?: string;
  resolutionNote?: string;
  finalEvidence?: AuthorityEvidenceImage;
  updates: AuthorityWorkUpdate[];
  feedback: AuthorityResidentFeedback[];
};

const taka = '\u09F3';

const initialAuthorityComplaintDetails: AuthorityComplaintDetail[] = [
  {
    id: 'CMP-1048',
    title: 'Overflowing drain beside community school',
    description: 'The drain is overflowing onto the road and blocking the pedestrian path.',
    date: '18 Jul, 9:25 AM',
    location: 'Road 7, Block C',
    category: 'Drainage',
    status: 'PENDING',
    urgency: 47,
    lat: 23.8385,
    lng: 90.3685,
    reporter: 'Nusrat Jahan',
    reporterInitials: 'NJ',
    reporterPhone: '+880 1712-345678',
    submittedAt: '18 Jul 2026, 9:25 AM',
    zone: 'Zone 3 · Block C',
    evidence: require('../../../assets/images/authority/evidence/pending-drain.png'),
    deadline: '24 Jul 2026',
    budget: `${taka} 18,000`,
    workNote: 'Inspect the drain line, remove the blockage, and clear the pedestrian path.',
    progress: 0,
    feedback: [],
    updates: [
      {
        id: 'UPD-1048-1',
        title: 'Complaint verified and assigned',
        note: 'Evidence and location were reviewed by the community office.',
        timestamp: '18 Jul, 11:10 AM',
        complete: true,
        budget: 'Not assigned',
        images: [],
      },
      {
        id: 'UPD-1048-2',
        title: 'Waiting for authority action',
        note: 'Add the work plan to move this complaint into progress.',
        timestamp: 'Pending',
        complete: false,
        budget: `${taka} 18,000 proposed`,
        images: [],
      },
    ],
  },
  {
    id: 'CMP-1042',
    title: 'Streetlights not working near the east gate',
    description: 'Several streetlights are out and the entrance becomes unsafe after sunset.',
    date: '17 Jul, 8:40 PM',
    location: 'East Gate, Block A',
    category: 'Streetlight',
    status: 'IN PROGRESS',
    urgency: 35,
    lat: 23.836,
    lng: 90.3705,
    reporter: 'Mahmud Hasan',
    reporterInitials: 'MH',
    reporterPhone: '+880 1811-902411',
    submittedAt: '17 Jul 2026, 8:40 PM',
    zone: 'Zone 1 · Block A',
    evidence: require('../../../assets/images/authority/evidence/in-progress-streetlight.png'),
    deadline: '23 Jul 2026',
    budget: `${taka} 26,500`,
    workNote: 'Replace the damaged control unit and test both entrance lights after sunset.',
    progress: 65,
    feedback: [],
    updates: [
      {
        id: 'UPD-1042-1',
        title: 'Work started',
        note: 'Electrical team inspected both poles and isolated the faulty control unit.',
        timestamp: '18 Jul, 10:15 AM',
        complete: true,
        budget: `${taka} 24,000`,
        images: [
          require('../../../assets/images/authority/evidence/in-progress-streetlight.png'),
        ],
      },
      {
        id: 'UPD-1042-2',
        title: 'Repair underway',
        note: 'Replacement equipment arrived and installation is in progress.',
        timestamp: '19 Jul, 3:30 PM',
        complete: true,
        budget: `${taka} 26,500`,
        images: [
          require('../../../assets/images/authority/evidence/streetlight-repair-progress.png'),
        ],
      },
      {
        id: 'UPD-1042-3',
        title: 'Final testing',
        note: 'Night-time lighting test remains before resolution.',
        timestamp: 'Next step',
        complete: false,
        budget: `${taka} 26,500`,
        images: [],
      },
    ],
  },
  {
    id: 'CMP-1039',
    title: 'Water leakage flooding the pedestrian path',
    description: 'A damaged supply pipe is continuously leaking beside the footpath.',
    date: '17 Jul, 2:10 PM',
    location: 'Road 3, Block B',
    category: 'Water Supply',
    status: 'PENDING',
    urgency: 29,
    lat: 23.8375,
    lng: 90.369,
    reporter: 'Sadia Islam',
    reporterInitials: 'SI',
    reporterPhone: '+880 1914-223890',
    submittedAt: '17 Jul 2026, 2:10 PM',
    zone: 'Zone 2 · Block B',
    evidence: require('../../../assets/images/authority/evidence/pending-water-leak.png'),
    deadline: '25 Jul 2026',
    budget: `${taka} 32,000`,
    workNote: 'Shut off the damaged line, replace the cracked pipe section, and clean the footpath.',
    progress: 0,
    feedback: [],
    updates: [
      {
        id: 'UPD-1039-1',
        title: 'Complaint verified and assigned',
        note: 'The leak and coordinates were confirmed from the submitted evidence.',
        timestamp: '17 Jul, 4:35 PM',
        complete: true,
        budget: 'Not assigned',
        images: [],
      },
      {
        id: 'UPD-1039-2',
        title: 'Waiting for authority action',
        note: 'A work plan and safety deadline are required.',
        timestamp: 'Pending',
        complete: false,
        budget: `${taka} 32,000 proposed`,
        images: [],
      },
    ],
  },
  {
    id: 'CMP-1034',
    title: 'Damaged road surface beside the market',
    description: 'The broken road surface is slowing traffic and creating a safety risk.',
    date: '16 Jul, 11:15 AM',
    location: 'Market Road, Block D',
    category: 'Road',
    status: 'IN PROGRESS',
    urgency: 21,
    lat: 23.8392,
    lng: 90.3712,
    reporter: 'Imran Kabir',
    reporterInitials: 'IK',
    reporterPhone: '+880 1610-778214',
    submittedAt: '16 Jul 2026, 11:15 AM',
    zone: 'Zone 4 · Block D',
    evidence: require('../../../assets/images/authority/evidence/in-progress-road.png'),
    deadline: '26 Jul 2026',
    budget: `${taka} 74,000`,
    workNote: 'Remove loose asphalt, rebuild the base, and compact a durable surface patch.',
    progress: 45,
    feedback: [],
    updates: [
      {
        id: 'UPD-1034-1',
        title: 'Work started',
        note: 'The repair area was secured and loose road material was removed.',
        timestamp: '17 Jul, 8:45 AM',
        complete: true,
        budget: `${taka} 65,000`,
        images: [require('../../../assets/images/authority/evidence/in-progress-road.png')],
      },
      {
        id: 'UPD-1034-2',
        title: 'Base layer prepared',
        note: 'Aggregate base was placed; asphalt compaction is underway.',
        timestamp: '18 Jul, 1:20 PM',
        complete: true,
        budget: `${taka} 74,000`,
        images: [
          require('../../../assets/images/authority/evidence/road-repair-progress.png'),
        ],
      },
      {
        id: 'UPD-1034-3',
        title: 'Surface inspection',
        note: 'Final compaction and edge inspection remain.',
        timestamp: 'Next step',
        complete: false,
        budget: `${taka} 74,000`,
        images: [],
      },
    ],
  },
  {
    id: 'CMP-1027',
    title: 'Garbage collection missed for three days',
    description: 'The missed collection was completed and the roadside waste was removed.',
    date: '15 Jul, 7:30 AM',
    location: 'Lane 2, Block E',
    category: 'Waste',
    status: 'RESOLVED',
    urgency: 16,
    lat: 23.8357,
    lng: 90.3672,
    reporter: 'Farzana Ahmed',
    reporterInitials: 'FA',
    reporterPhone: '+880 1718-669032',
    submittedAt: '15 Jul 2026, 7:30 AM',
    zone: 'Zone 5 · Block E',
    evidence: require('../../../assets/images/authority/evidence/resolved-waste.png'),
    deadline: '17 Jul 2026',
    budget: `${taka} 12,500`,
    workNote: 'Remove accumulated waste, sanitize the collection point, and restore the pickup schedule.',
    progress: 100,
    completedAt: '16 Jul 2026, 5:40 PM',
    resolutionNote:
      'All accumulated waste was removed, the collection point was swept and sanitized, and the normal pickup schedule was restored.',
    finalEvidence: require('../../../assets/images/authority/evidence/waste-resolution-proof-v2.png'),
    feedback: [
      {
        id: 'FDB-1027-1',
        resident: 'Farzana Ahmed',
        residentInitials: 'FA',
        rating: 5,
        comment: 'The team cleared everything and left the walkway much cleaner than before.',
        receivedAt: '17 Jul 2026, 9:15 AM',
      },
      {
        id: 'FDB-1027-2',
        resident: 'Rafiul Karim',
        residentInitials: 'RK',
        rating: 4,
        comment: 'Good response and the regular collection schedule has started again.',
        receivedAt: '17 Jul 2026, 1:40 PM',
      },
      {
        id: 'FDB-1027-3',
        resident: 'Maliha Noor',
        residentInitials: 'MN',
        rating: 5,
        comment: 'The final photo matches the clean condition we can see at the location.',
        receivedAt: '18 Jul 2026, 10:05 AM',
      },
    ],
    updates: [
      {
        id: 'UPD-1027-1',
        title: 'Work started',
        note: 'A collection vehicle and sanitation team were assigned.',
        timestamp: '15 Jul, 10:20 AM',
        complete: true,
        budget: `${taka} 10,000`,
        images: [],
      },
      {
        id: 'UPD-1027-2',
        title: 'Waste removed',
        note: 'The roadside pile was collected and the area was washed.',
        timestamp: '16 Jul, 4:55 PM',
        complete: true,
        budget: `${taka} 12,500`,
        images: [
          require('../../../assets/images/authority/evidence/resolved-waste.png'),
        ],
      },
      {
        id: 'UPD-1027-3',
        title: 'Complaint resolved',
        note: 'Final inspection confirmed the area was clean and accessible.',
        timestamp: '16 Jul, 5:40 PM',
        complete: true,
        budget: `${taka} 12,500`,
        images: [
          require('../../../assets/images/authority/evidence/waste-resolution-proof-v2.png'),
        ],
      },
    ],
  },
];

export function createInitialAuthorityComplaintDetails(): AuthorityComplaintDetail[] {
  return initialAuthorityComplaintDetails.map((complaint) => ({
    ...complaint,
    updates: complaint.updates.map((update) => ({
      ...update,
      images: [...update.images],
    })),
    feedback: complaint.feedback.map((item) => ({ ...item })),
  }));
}
