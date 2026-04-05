export interface CriticalFlaw {
  category: 'format' | 'content' | 'keywords' | 'structure';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface LinkedInProfile {
  headline: string;
  about: string;
  experiences: { role: string; company: string; bullets: string[] }[];
}

export interface Job {
  title: string;
  company: string;
  location: string;
  matchPercentage: number;
  url: string;
  source: string;
}

export interface Analysis {
  id: string;
  userId?: string;
  originalText: string;
  atsScore: number;
  criticalFlaws: CriticalFlaw[];
  generatedResume?: string;
  generatedLinkedIn?: LinkedInProfile;
  suggestedJobs?: Job[];
  createdAt: string; // ISO String instead of Timestamp for frontend portability
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  targetProvince: string;
  targetNoc: string;
  isPremium: boolean;
  createdAt: string;
}
