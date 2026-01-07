export interface Teacher {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  hoursPerWeek: number;
  isLab: boolean;
  labDuration: 2 | 3; // consecutive periods for labs
  color: string;
}

export interface TimetableSlot {
  id: string;
  subjectId: string | null;
  day: number; // 0-4 (Mon-Fri)
  period: number; // 0-7 (8 periods)
  isLunchBreak: boolean;
}

export interface TimetableConfig {
  periodsPerDay: number;
  lunchBreakPeriod: number; // which period is lunch (0-indexed)
  startTime: string; // e.g., "09:00"
  periodDuration: number; // in minutes
}

export interface Conflict {
  type: 'teacher-double-booking' | 'lab-split' | 'hours-exceeded';
  message: string;
  slots: string[]; // slot ids involved
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export const SUBJECT_COLORS = [
  'hsl(210, 70%, 75%)',
  'hsl(150, 60%, 70%)',
  'hsl(45, 80%, 75%)',
  'hsl(340, 65%, 75%)',
  'hsl(270, 55%, 75%)',
  'hsl(180, 50%, 70%)',
  'hsl(30, 75%, 70%)',
  'hsl(200, 65%, 70%)',
];
