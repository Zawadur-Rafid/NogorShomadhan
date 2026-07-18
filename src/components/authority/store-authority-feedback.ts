import type { ImageSourcePropType } from 'react-native';

export type AuthorityFeedback = {
  id: string;
  complaintId: string;
  complaintTitle: string;
  category: string;
  resident: string;
  initials: string;
  rating: number;
  comment: string;
  receivedAt: string;
  location: string;
  image: ImageSourcePropType;
};

export type AuthorityFeedbackComment = {
  id: string;
  author: string;
  initials: string;
  message: string;
  postedAt: string;
  authority?: boolean;
  replyTo?: string;
};

export const authorityFeedbackSummary = {
  averageRating: 4.6,
  totalFeedback: 48,
  satisfaction: 92,
};

// Temporary feedback data. Replace this file when the Authority feedback API is connected.
export const authorityFeedback: AuthorityFeedback[] = [
  {
    id: 'FDB-201',
    complaintId: 'CMP-1018',
    complaintTitle: 'Rainwater clogging the residential road',
    category: 'Drainage',
    resident: 'Nusrat Jahan',
    initials: 'NJ',
    rating: 5,
    comment: 'The response team cleared the blocked drain quickly. Water now moves away properly even after heavy rain.',
    receivedAt: '18 Jul, 4:20 PM',
    location: 'Lake Road, Block B',
    image: require('../../../assets/images/authority/rain-clogged-road.png'),
  },
  {
    id: 'FDB-196',
    complaintId: 'CMP-1009',
    complaintTitle: 'Broken streetlight near residential entrance',
    category: 'Streetlight',
    resident: 'Mahmud Hasan',
    initials: 'MH',
    rating: 4,
    comment: 'The broken fixture was replaced and the road is visible again at night. The work was good, though it took an extra day.',
    receivedAt: '16 Jul, 8:10 PM',
    location: 'Central Avenue',
    image: require('../../../assets/images/authority/broken-streetlight.png'),
  },
];

export const authorityFeedbackComments: Record<string, AuthorityFeedbackComment[]> = {
  'FDB-201': [
    {
      id: 'CMT-301',
      author: 'Farzana Ahmed',
      initials: 'FA',
      message: 'The water cleared much faster this time. Please keep the drain checked before the next heavy rain.',
      postedAt: '18 Jul, 5:05 PM',
    },
    {
      id: 'CMT-302',
      author: 'Imran Kabir',
      initials: 'IK',
      message: 'Agreed. The corner beside the school still collects leaves after every storm.',
      postedAt: '18 Jul, 5:22 PM',
      replyTo: 'Farzana Ahmed',
    },
    {
      id: 'CMT-303',
      author: 'Community Authority',
      initials: 'CA',
      message: 'Thank you both. A preventive drain inspection has been added to the maintenance schedule.',
      postedAt: '18 Jul, 6:10 PM',
      authority: true,
      replyTo: 'Imran Kabir',
    },
  ],
  'FDB-196': [
    {
      id: 'CMT-304',
      author: 'Sadia Islam',
      initials: 'SI',
      message: 'The entrance feels much safer now. Is the second light farther down the road also being checked?',
      postedAt: '16 Jul, 8:35 PM',
    },
    {
      id: 'CMT-305',
      author: 'Mahmud Hasan',
      initials: 'MH',
      message: 'I noticed that one flickering yesterday as well. It may need a separate inspection.',
      postedAt: '16 Jul, 8:49 PM',
      replyTo: 'Sadia Islam',
    },
  ],
};
