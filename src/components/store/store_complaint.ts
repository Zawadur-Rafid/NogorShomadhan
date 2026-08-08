export interface DummyComplaint {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'PENDING' | 'IN PROGRESS' | 'RESOLVED';
  category: string;
  urgencyCount: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string; // Description of evidence
  image: string; // Primary evidence picture
  images: string[]; // Multiple evidence pictures
  isMyComplaint?: boolean;
  color: string;
  icon: string;
  lat: number;
  lng: number;
  contractorAssignments?: any[];
  updates?: any[];
  completedAt?: string;
  deadline?: string;
  budget?: string;
  resolutionNote?: string;
  finalEvidence?: string;
  approvedBy?: any;
  feedback?: any[];
}

export const dummyComplaints: DummyComplaint[] = [
  {
    id: "1",
    title: "Broken Main Pipe",
    description: "Significant water leakage on Avenue 1 near the mosque. Water level rising on sidewalk.",
    date: "Oct 24, 2023",
    location: "Avenue 1, Mirpur DOHS",
    status: "PENDING",
    category: "Water Supply",
    urgencyCount: 14,
    urgencyLevel: "HIGH",
    evidence: "Photos showing main pipe water bursting onto public sidewalk and flooding near Mosque entrance.",
    image: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: true,
    color: "#F87171",
    icon: "water-outline",
    lat: 23.8385,
    lng: 90.3685,
  },
  {
    id: "2",
    title: "Major Pothole",
    description: "Deep pothole causing traffic hazards near the central park. Requires urgent asphalt resurfacing.",
    date: "Oct 21, 2023",
    location: "Park Area, Mirpur DOHS",
    status: "RESOLVED",
    category: "Roads & Traffic",
    urgencyCount: 8,
    urgencyLevel: "MEDIUM",
    evidence: "Photo showing 8-inch deep crater on main thoroughfare.",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: false,
    color: "#60A5FA",
    icon: "construct-outline",
    lat: 23.8360,
    lng: 90.3705,
    completedAt: 'Oct 23, 2023, 4:00 PM',
    deadline: 'Oct 25, 2023',
    budget: '৳ 35,000',
    resolutionNote: 'The pothole was completely filled with asphalt and compacted correctly. The road is safe again.',
    finalEvidence: 'https://ichef.bbci.co.uk/news/1024/cpsprodpb/a54e/live/3c4327e0-2855-11ef-a07f-09e6d1fd4403.jpg.webp',
    approvedBy: {
      name: 'Rezaul Karim',
      initials: 'RK',
      role: 'Community Authority',
      approvedAt: 'Oct 23, 2023, 5:30 PM',
    },
    feedback: [
      {
        id: 'f-1',
        resident: 'Aminul Islam',
        residentInitials: 'AI',
        rating: 5,
        comment: 'Great job fixing this quickly! The road is smooth now.',
        receivedAt: 'Oct 24, 2023',
      }
    ],
    contractorAssignments: [
      {
        id: 'ca-5',
        name: 'Road Builders Inc.',
        phone: '+880 1912-333444',
        assignedFrom: 'Oct 22, 2023, 8:00 AM',
        assignedUntil: 'Oct 23, 2023, 4:00 PM'
      }
    ],
    updates: [
      {
        id: 'u-2-1',
        contractorAssignmentId: 'ca-5',
        title: 'Work started',
        note: 'Excavation around pothole completed.',
        timestamp: 'Oct 22, 2023, 10:00 AM',
        complete: true,
        budget: '৳ 10,000',
        images: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800"],
      },
      {
        id: 'u-2-2',
        contractorAssignmentId: 'ca-5',
        title: 'Filling & Compaction',
        note: 'Poured hot asphalt and compacted.',
        timestamp: 'Oct 23, 2023, 2:00 PM',
        complete: true,
        budget: '৳ 35,000',
        images: [],
      }
    ],
  },
  {
    id: "3",
    title: "Street Light Failure",
    description: "Three consecutive lamps are out, making Avenue 3 pitch dark at night. Safety hazard for pedestrians.",
    date: "Oct 19, 2023",
    location: "Avenue 3, Mirpur DOHS",
    status: "IN PROGRESS",
    category: "Streetlights",
    urgencyCount: 19,
    urgencyLevel: "HIGH",
    evidence: "Night photos showing unlit street section between poles #12 and #15.",
    image: "https://images.unsplash.com/photo-1513222588078-d5e6ebac17f3?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1513222588078-d5e6ebac17f3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: true,
    color: "#C67B00",
    icon: "bulb-outline",
    lat: 23.8375,
    lng: 90.3690,
    contractorAssignments: [
      {
        id: 'ca-1',
        name: 'Dhaka Light Services',
        phone: '+880 1711-000000',
        assignedFrom: 'Oct 20, 2023, 10:15 AM',
      }
    ],
    updates: [
      {
        id: 'u-1',
        contractorAssignmentId: 'ca-1',
        title: 'Work started',
        note: 'Electrical team inspected both poles and isolated the faulty control unit.',
        timestamp: 'Oct 20, 2023, 10:15 AM',
        complete: true,
        budget: '৳ 15,000',
        images: ["https://images.unsplash.com/photo-1513222588078-d5e6ebac17f3?auto=format&fit=crop&q=80&w=800"],
      },
      {
        id: 'u-2',
        contractorAssignmentId: 'ca-1',
        title: 'Repair underway',
        note: 'Replacement equipment arrived and installation is in progress.',
        timestamp: 'Oct 21, 2023, 3:30 PM',
        complete: true,
        budget: '৳ 22,000',
        images: ["https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=800"],
      },
      {
        id: 'u-3',
        contractorAssignmentId: 'ca-1',
        title: 'Final testing',
        note: 'Night-time lighting test remains before resolution.',
        timestamp: 'Pending',
        complete: false,
        budget: '৳ 22,000',
        images: [],
      }
    ],
  },
  {
    id: "4",
    title: "Garbage Overflow",
    description: "The main garbage bin near the community center is overflowing into the street creating foul odor.",
    date: "Oct 26, 2023",
    location: "Community Center, Mirpur DOHS",
    status: "PENDING",
    category: "Waste Management",
    urgencyCount: 25,
    urgencyLevel: "CRITICAL",
    evidence: "Photo of overflowing dumpster and uncollected waste bags.",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: false,
    color: "#F87171",
    icon: "trash-outline",
    lat: 23.8390,
    lng: 90.3675,
  },
  {
    id: "5",
    title: "Broken Swing",
    description: "One of the chain swings in the children's park has snapped and has sharp metallic edges exposed.",
    date: "Oct 27, 2023",
    location: "Children's Park, Mirpur DOHS",
    status: "IN PROGRESS",
    category: "Parks & Recreation",
    urgencyCount: 6,
    urgencyLevel: "MEDIUM",
    evidence: "Photo of broken swing set chain.",
    image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: false,
    color: "#C67B00",
    icon: "bicycle-outline",
    lat: 23.8365,
    lng: 90.3710,
    contractorAssignments: [
      {
        id: 'ca-2',
        name: 'Safe Playgrounds Ltd.',
        phone: '+880 1711-222333',
        assignedFrom: 'Oct 28, 2023, 9:00 AM',
      }
    ],
    updates: [
      {
        id: 'u-5-1',
        contractorAssignmentId: 'ca-2',
        title: 'Area secured',
        note: 'Swings were barricaded to prevent injuries while waiting for parts.',
        timestamp: 'Oct 28, 2023, 9:30 AM',
        complete: true,
        budget: '৳ 2,000',
        images: ["https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800"],
      },
      {
        id: 'u-5-2',
        contractorAssignmentId: 'ca-2',
        title: 'Replacement pending',
        note: 'New chain sets ordered from supplier. Estimated delivery in 2 days.',
        timestamp: 'Pending',
        complete: false,
        budget: '৳ 8,500',
        images: [],
      }
    ],
  },
  {
    id: "6",
    title: "Illegal Parking",
    description: "Multiple commercial vehicles parked illegally on Avenue 5, completely blocking pedestrian walkway.",
    date: "Oct 28, 2023",
    location: "Avenue 5, Mirpur DOHS",
    status: "RESOLVED",
    category: "Roads & Traffic",
    urgencyCount: 11,
    urgencyLevel: "LOW",
    evidence: "Photo of license plates and blocked sidewalk.",
    image: "https://images.unsplash.com/photo-1510442650500-93217e634e4c?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1510442650500-93217e634e4c?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: false,
    color: "#60A5FA",
    icon: "car-outline",
    lat: 23.8380,
    lng: 90.3660,
    completedAt: 'Oct 29, 2023, 11:00 AM',
    deadline: 'Oct 30, 2023',
    budget: '৳ 0',
    resolutionNote: 'Vehicles were towed and owners were fined. Walkway is now completely clear.',
    finalEvidence: 'https://images.unsplash.com/photo-1533227260828-531422ab88a8?auto=format&fit=crop&q=80&w=800',
    approvedBy: {
      name: 'Rezaul Karim',
      initials: 'RK',
      role: 'Community Authority',
      approvedAt: 'Oct 29, 2023, 11:30 AM',
    },
    feedback: [
      {
        id: 'f-2',
        resident: 'Farzana Rahman',
        residentInitials: 'FR',
        rating: 4,
        comment: 'Thanks for clearing the walkway. Hopefully they don\'t park here again.',
        receivedAt: 'Oct 30, 2023',
      }
    ],
    contractorAssignments: [
      {
        id: 'ca-6',
        name: 'City Towing Services',
        phone: '+880 1711-555666',
        assignedFrom: 'Oct 29, 2023, 9:00 AM',
        assignedUntil: 'Oct 29, 2023, 11:00 AM'
      }
    ],
    updates: [
      {
        id: 'u-6-1',
        contractorAssignmentId: 'ca-6',
        title: 'Towing started',
        note: 'Towing trucks arrived and started removing the commercial vehicles.',
        timestamp: 'Oct 29, 2023, 9:30 AM',
        complete: true,
        budget: '৳ 0',
        images: ["https://images.unsplash.com/photo-1510442650500-93217e634e4c?auto=format&fit=crop&q=80&w=800"],
      }
    ],
  },
  {
    id: "7",
    title: "Fallen Tree Branch",
    description: "A large tree branch fell down during yesterday's rainstorm, blocking half of Avenue 2.",
    date: "Oct 29, 2023",
    location: "Avenue 2, Mirpur DOHS",
    status: "PENDING",
    category: "Parks & Recreation",
    urgencyCount: 16,
    urgencyLevel: "HIGH",
    evidence: "Photo of fallen branch obstructing northbound lane.",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: true,
    color: "#F87171",
    icon: "leaf-outline",
    lat: 23.8355,
    lng: 90.3695,
  },
  {
    id: "8",
    title: "Stray Dogs Aggression",
    description: "A pack of stray dogs has been chasing school children and residents near Avenue 4 corner.",
    date: "Oct 30, 2023",
    location: "Avenue 4, Mirpur DOHS",
    status: "IN PROGRESS",
    category: "Public Safety",
    urgencyCount: 22,
    urgencyLevel: "CRITICAL",
    evidence: "Resident photo report of dog pack aggregation area near school gate.",
    image: "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: false,
    color: "#C67B00",
    icon: "paw-outline",
    lat: 23.8370,
    lng: 90.3680,
    contractorAssignments: [
      {
        id: 'ca-3',
        name: 'Animal Rescue Services',
        phone: '+880 1819-444555',
        assignedFrom: 'Oct 31, 2023, 7:00 AM',
      }
    ],
    updates: [
      {
        id: 'u-8-1',
        contractorAssignmentId: 'ca-3',
        title: 'Evaluation',
        note: 'Rescue team arrived and evaluated the pack behavior.',
        timestamp: 'Oct 31, 2023, 7:30 AM',
        complete: true,
        budget: '৳ 5,000',
        images: ["https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=800"],
      },
      {
        id: 'u-8-2',
        contractorAssignmentId: 'ca-3',
        title: 'Relocation ongoing',
        note: 'Currently working on safe capture and relocation.',
        timestamp: 'Pending',
        complete: false,
        budget: '৳ 10,000',
        images: [],
      }
    ],
  },
  {
    id: "9",
    title: "Open Drainage Manhole",
    description: "An open manhole without a protective cover is posing a severe hazard to night motorists.",
    date: "Oct 31, 2023",
    location: "Avenue 6, Mirpur DOHS",
    status: "PENDING",
    category: "Drainage System",
    urgencyCount: 30,
    urgencyLevel: "CRITICAL",
    evidence: "Photos showing missing concrete manhole cover from multiple angles.",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: true,
    color: "#F87171",
    icon: "warning-outline",
    lat: 23.8395,
    lng: 90.3700,
  },
  {
    id: "10",
    title: "Damaged Electric Transformer",
    description: "Sparks emitting from the roadside transformer box on Road 9. Requires immediate inspection.",
    date: "Nov 02, 2023",
    location: "Road 9, Mirpur DOHS",
    status: "PENDING",
    category: "Electricity",
    urgencyCount: 28,
    urgencyLevel: "CRITICAL",
    evidence: "Close up images of burnt fuse panel and sparking wires.",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: true,
    color: "#F87171",
    icon: "flash-outline",
    lat: 23.8392,
    lng: 90.3698,
  },
  {
    id: "11",
    title: "Clogged Storm Drain",
    description: "Heavy water logging on Road 12 after short rain due to plastic waste blockage in storm drain.",
    date: "Nov 04, 2023",
    location: "Road 12, Mirpur DOHS",
    status: "IN PROGRESS",
    category: "Drainage System",
    urgencyCount: 15,
    urgencyLevel: "HIGH",
    evidence: "Photos of submerged curb line and clogged drainage grate.",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: true,
    color: "#C67B00",
    icon: "water-outline",
    lat: 23.8388,
    lng: 90.3712,
    contractorAssignments: [
      {
        id: 'ca-4',
        name: 'City Drain Cleaners',
        phone: '+880 1677-888999',
        assignedFrom: 'Nov 04, 2023, 2:00 PM',
      }
    ],
    updates: [
      {
        id: 'u-11-1',
        contractorAssignmentId: 'ca-4',
        title: 'Initial clearing',
        note: 'Surface plastic waste removed to allow slow drainage.',
        timestamp: 'Nov 04, 2023, 3:30 PM',
        complete: true,
        budget: '৳ 3,000',
        images: ["https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800"],
      },
      {
        id: 'u-11-2',
        contractorAssignmentId: 'ca-4',
        title: 'Deep cleaning',
        note: 'Vacuum truck ordered to remove deep silt blockage.',
        timestamp: 'Pending',
        complete: false,
        budget: '৳ 15,000',
        images: [],
      }
    ],
  },
  {
    id: "12",
    title: "Hazardous Construction Waste",
    description: "Debris and sharp bricks left unattended on sidewalk in front of Plot 45.",
    date: "Nov 05, 2023",
    location: "Road 14, Mirpur DOHS",
    status: "RESOLVED",
    category: "Waste Management",
    urgencyCount: 9,
    urgencyLevel: "MEDIUM",
    evidence: "Before & after cleanup verification photos.",
    image: "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800",
    ],
    isMyComplaint: false,
    color: "#60A5FA",
    icon: "construct-outline",
    lat: 23.8378,
    lng: 90.3682,
    completedAt: 'Nov 06, 2023, 5:00 PM',
    deadline: 'Nov 07, 2023',
    budget: '৳ 5,000',
    resolutionNote: 'All construction waste was cleared and the sidewalk is clean.',
    finalEvidence: 'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?auto=format&fit=crop&q=80&w=800',
    approvedBy: {
      name: 'Rezaul Karim',
      initials: 'RK',
      role: 'Community Authority',
      approvedAt: 'Nov 06, 2023, 5:30 PM',
    },
    feedback: [
      {
        id: 'f-3',
        resident: 'Kazi Tariq',
        residentInitials: 'KT',
        rating: 5,
        comment: 'Very clean work, the sidewalk is perfectly walkable now.',
        receivedAt: 'Nov 07, 2023',
      }
    ],
    contractorAssignments: [
      {
        id: 'ca-7',
        name: 'Clean Dhaka Crew',
        phone: '+880 1819-777888',
        assignedFrom: 'Nov 06, 2023, 10:00 AM',
        assignedUntil: 'Nov 06, 2023, 5:00 PM'
      }
    ],
    updates: [
      {
        id: 'u-12-1',
        contractorAssignmentId: 'ca-7',
        title: 'Waste removal',
        note: 'Loaded all bricks and debris into the dump truck.',
        timestamp: 'Nov 06, 2023, 2:00 PM',
        complete: true,
        budget: '৳ 5,000',
        images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800"],
      }
    ],
  },
];
