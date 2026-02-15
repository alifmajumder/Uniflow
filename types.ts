export enum DayOfWeek {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday'
}

export interface ClassSession {
  id: string;
  courseName: string;
  courseCode: string;
  faculty: string;
  room: string;
  day: DayOfWeek;
  startTime: string; // HH:mm 24h format
  endTime: string;   // HH:mm 24h format
  color?: string;
}

export interface Task {
  id: string;
  courseCode: string; // Links to ClassSession.courseCode
  title: string;
  description: string;
  deadline: string; // ISO String
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface AppState {
  schedule: ClassSession[];
  tasks: Task[];
  preferences: AppPreferences;
}

export interface AppPreferences {
  themeId: string;
  showQuotes: boolean;
}

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>; // Maps variable name to value
  previewColor: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  error: string | null;
  message: string;
}