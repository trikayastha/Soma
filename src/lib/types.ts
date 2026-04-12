export type Intensity = '12h' | '16h' | '24h';

export type LunarPhaseName =
  | 'new-moon'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full-moon'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export type SomaDayKind = 'ekadashi' | 'full-moon' | 'new-moon' | 'chaturthi';

export interface SomaDay {
  date: string; // ISO yyyy-mm-dd
  kind: SomaDayKind;
  intensityHours: number;
  title: string;
  tradition: 'vedic' | 'newa-buddhist';
}

export interface FastSession {
  id: string;
  dayDate: string;
  startedAt: string;
  endedAt?: string;
  intensityHours: number;
  status: 'active' | 'completed' | 'aborted';
  preLog?: SubjectiveLog;
  postLog?: SubjectiveLog;
}

export interface SubjectiveLog {
  energy: number;
  focus: number;
  mood: number;
  sleep: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  timezone: string;
  experience: 'none' | 'some' | 'experienced';
  goal: 'focus' | 'calm' | 'discipline' | 'metabolic';
  defaultIntensity: Intensity;
  onboardedAt: string;
  safetyFlags: SafetyFlags;
}

export interface SafetyFlags {
  pregnant: boolean;
  eatingDisorderHistory: boolean;
  diabetes: boolean;
  under18: boolean;
}

export interface AppState {
  profile: UserProfile | null;
  schedule: SomaDay[];
  sessions: FastSession[];
  onboardingComplete: boolean;
}
