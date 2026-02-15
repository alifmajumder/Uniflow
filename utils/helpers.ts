import { ClassSession, Task, AppPreferences, Theme } from '../types';

export const generateId = (): string => Math.random().toString(36).substring(2, 9);

export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export const getDayIndex = (day: string): number => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(day);
};

export const getRandomColor = (): string => {
  const colors = [
    'bg-red-500/20 border-red-500/50 text-red-200',
    'bg-orange-500/20 border-orange-500/50 text-orange-200',
    'bg-amber-500/20 border-amber-500/50 text-amber-200',
    'bg-green-500/20 border-green-500/50 text-green-200',
    'bg-emerald-500/20 border-emerald-500/50 text-emerald-200',
    'bg-teal-500/20 border-teal-500/50 text-teal-200',
    'bg-cyan-500/20 border-cyan-500/50 text-cyan-200',
    'bg-sky-500/20 border-sky-500/50 text-sky-200',
    'bg-blue-500/20 border-blue-500/50 text-blue-200',
    'bg-indigo-500/20 border-indigo-500/50 text-indigo-200',
    'bg-violet-500/20 border-violet-500/50 text-violet-200',
    'bg-purple-500/20 border-purple-500/50 text-purple-200',
    'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200',
    'bg-pink-500/20 border-pink-500/50 text-pink-200',
    'bg-rose-500/20 border-rose-500/50 text-rose-200',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const STORAGE_KEY_SCHEDULE = 'unisync_schedule';
const STORAGE_KEY_TASKS = 'unisync_tasks';
const STORAGE_KEY_PREFS = 'unisync_prefs';

export const saveSchedule = (schedule: ClassSession[]) => {
  localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
};

export const loadSchedule = (): ClassSession[] => {
  const data = localStorage.getItem(STORAGE_KEY_SCHEDULE);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
};

export const loadTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEY_TASKS);
  return data ? JSON.parse(data) : [];
};

export const savePreferences = (prefs: AppPreferences) => {
  localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
};

export const loadPreferences = (): AppPreferences => {
  const data = localStorage.getItem(STORAGE_KEY_PREFS);
  const defaults: AppPreferences = {
    themeId: 'ocean',
    enableNotifications: true,
    notificationSettings: {
        classReminders: true,
        taskDayBefore: true,
        taskDeadline: true,
        taskHourBefore: true
    },
    showQuotes: true
  };
  
  if (data) {
      const parsed = JSON.parse(data);
      return {
          ...defaults,
          ...parsed,
          // Ensure nested object exists if loading from old data
          notificationSettings: {
              ...defaults.notificationSettings,
              ...(parsed.notificationSettings || {})
          }
      };
  }
  return defaults;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const exportData = (schedule: ClassSession[], tasks: Task[]) => {
  const data = { schedule, tasks, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unisync-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Check if app is running in standalone mode (PWA, TWA, or WebView)
export const isAppStandalone = (): boolean => {
  // 1. Standard PWA display modes
  const mqStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const mqFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const mqMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
  
  // 2. iOS Safari standalone
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // 3. Android TWA (Trusted Web Activity) often has this referrer
  const isTWA = document.referrer.includes('android-app://');
  
  // 4. Android WebView detection via User Agent (Look for 'wv' or 'Version/* Chrome/*')
  // Many wrappers inject 'wv' into the UA string.
  const userAgent = navigator.userAgent || '';
  const isAndroidWebView = /wv|WebView/i.test(userAgent) && /Android/i.test(userAgent);

  return mqStandalone || mqFullscreen || mqMinimalUi || isIOSStandalone || isTWA || isAndroidWebView;
};

// THEMES
export const themes: Theme[] = [
  {
    id: 'ocean',
    name: 'Electric Ocean',
    previewColor: '#0ea5e9',
    colors: {
      '--p-50': '240 249 255',
      '--p-400': '56 189 248',
      '--p-500': '14 165 233',
      '--p-600': '2 132 199',
    }
  },
  {
    id: 'violet',
    name: 'Cyber Violet',
    previewColor: '#8b5cf6',
    colors: {
      '--p-50': '245 243 255',
      '--p-400': '167 139 250',
      '--p-500': '139 92 246',
      '--p-600': '124 58 237',
    }
  },
  {
    id: 'emerald',
    name: 'Neon Forest',
    previewColor: '#10b981',
    colors: {
      '--p-50': '236 253 245',
      '--p-400': '52 211 153',
      '--p-500': '16 185 129',
      '--p-600': '5 150 105',
    }
  },
  {
    id: 'rose',
    name: 'Retro Sunset',
    previewColor: '#f43f5e',
    colors: {
      '--p-50': '255 241 242',
      '--p-400': '251 113 133',
      '--p-500': '244 63 94',
      '--p-600': '225 29 72',
    }
  },
  {
    id: 'amber',
    name: 'Solar Flare',
    previewColor: '#f59e0b',
    colors: {
      '--p-50': '255 251 235',
      '--p-400': '251 191 36',
      '--p-500': '245 158 11',
      '--p-600': '217 119 6',
    }
  }
];

export const applyTheme = (themeId: string) => {
  const theme = themes.find(t => t.id === themeId) || themes[0];
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};