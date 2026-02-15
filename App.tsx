import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, ListTodo, Settings as SettingsIcon, Bell, BellOff, X, Clock, Calendar, AlertCircle, BellRing, Smartphone } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ScheduleGrid from './components/ScheduleGrid';
import TaskManager from './components/TaskManager';
import Settings from './components/Settings';
import { AppState, ClassSession, Task, AppPreferences } from './types';
import { loadSchedule, loadTasks, saveSchedule, saveTasks, loadPreferences, savePreferences, applyTheme, isAppStandalone } from './utils/helpers';

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-1 md:flex-initial md:min-w-[120px]
      ${active 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks' | 'settings'>('schedule');
  const [state, setState] = useState<AppState>({
    schedule: [],
    tasks: [],
    preferences: {
      themeId: 'ocean',
      enableNotifications: true,
      notificationSettings: {
        classReminders: true,
        taskDayBefore: true,
        taskDeadline: true,
        taskHourBefore: true
      },
      showQuotes: true
    }
  });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isStandalone, setIsStandalone] = useState(false);
  
  const notifiedClassesRef = useRef<Set<string>>(new Set());

  // Initialize
  useEffect(() => {
    const prefs = loadPreferences();
    setState({
      schedule: loadSchedule(),
      tasks: loadTasks(),
      preferences: prefs
    });
    
    applyTheme(prefs.themeId);
    
    // Check Standalone Status (APK/PWA)
    const standalone = isAppStandalone();
    setIsStandalone(standalone);
    
    // Register Service Worker for Mobile Notifications
    if ('serviceWorker' in navigator) {
      // Use absolute path to ensure correct scope resolution
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker Registered'))
        .catch(err => console.error('Service Worker Error', err));
    }

    // Check existing permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      
      // Check for Welcome Modal
      const seen = localStorage.getItem('unisync_welcome_seen');
      if (!seen && Notification.permission !== 'granted') {
        setShowWelcome(true);
      }
    }
  }, []);

  // Persistence
  useEffect(() => { saveSchedule(state.schedule); }, [state.schedule]);
  useEffect(() => { saveTasks(state.tasks); }, [state.tasks]);
  useEffect(() => { 
    savePreferences(state.preferences); 
    applyTheme(state.preferences.themeId);
  }, [state.preferences]);

  // Unified Notification Sender (Service Worker > Native)
  const notifyUser = async (title: string, body: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Try Service Worker first (Best for Android/Mobile)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Using 'renotify: true' and 'tag' is crucial for mobile lock screen alerts
        // 'requireInteraction: true' keeps it on screen until dismissed
        await registration.showNotification(title, {
          body,
          icon: '/vite.svg', 
          vibrate: [200, 100, 200],
          badge: '/vite.svg',
          tag: 'uniflow-alert',
          renotify: true,
          requireInteraction: true,
          data: { url: window.location.href }
        } as any);
        return;
      } catch (e) {
        console.warn("SW Notification failed, trying fallback", e);
      }
    }

    // Fallback to standard API
    try {
      new Notification(title, { body });
    } catch (e) {
      console.error("Notification failed", e);
    }
  };

  // Request Permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn("Notifications not supported in this environment");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);

      if (result === 'granted') {
        notifyUser("Notifications Enabled", "You will now receive alerts for your schedule.");
        updatePreferences({ enableNotifications: true });
      }
    } catch (e) {
      console.error("Permission request error", e);
    }
  };

  const sendTestNotification = () => {
    notifyUser("Test Notification", "This is a test alert from UniFlow.");
  };

  const handleWelcomeAction = async (allow: boolean) => {
    localStorage.setItem('unisync_welcome_seen', 'true');
    setShowWelcome(false);
    
    if (allow) {
      await requestPermission();
    }
  };

  // Reminder Logic
  useEffect(() => {
    if (!state.preferences.enableNotifications) return;

    const checkReminders = () => {
      const now = new Date();
      
      // Class Reminders
      if (state.preferences.notificationSettings.classReminders) {
          const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
          const currentHours = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentTimeInMinutes = currentHours * 60 + currentMinutes;

          state.schedule.forEach(session => {
            if (session.day !== currentDay) return;

            const [h, m] = session.startTime.split(':').map(Number);
            const sessionTimeInMinutes = h * 60 + m;
            const diff = sessionTimeInMinutes - currentTimeInMinutes;

            const notificationId = `class-${session.id}-${now.toDateString()}`;

            if (diff === 30 && !notifiedClassesRef.current.has(notificationId)) {
              notifyUser(`Class Reminder: ${session.courseCode}`, `${session.courseName} starts in 30 minutes at ${session.room}.`);
              notifiedClassesRef.current.add(notificationId);
            }
          });
      }

      // Task Reminders
      state.tasks.forEach(task => {
        if (!task.deadline || task.completed) return;

        const deadline = new Date(task.deadline);
        const notificationBaseId = `task-${task.id}`;

        const checkNotify = (time: Date, idSuffix: string, title: string, body: string) => {
           const diff = now.getTime() - time.getTime();
           if (diff >= 0 && diff < 60000) {
             const id = `${notificationBaseId}-${idSuffix}`;
             if (!notifiedClassesRef.current.has(id)) {
                notifyUser(title, body);
                notifiedClassesRef.current.add(id);
             }
           }
        };

        if (state.preferences.notificationSettings.taskDayBefore) {
            const dayBefore = new Date(deadline);
            dayBefore.setDate(dayBefore.getDate() - 1);
            dayBefore.setHours(0, 0, 0, 0);
            checkNotify(dayBefore, '24h', `Upcoming Deadline: ${task.courseCode}`, `${task.title} is due tomorrow.`);
        }
        
        if (state.preferences.notificationSettings.taskDeadline) {
            const dayOf = new Date(deadline);
            dayOf.setHours(0, 0, 0, 0);
            checkNotify(dayOf, 'today', `Deadline Today: ${task.courseCode}`, `${task.title} is due today.`);
        }

        if (state.preferences.notificationSettings.taskHourBefore) {
            const hourBefore = new Date(deadline.getTime() - 60 * 60 * 1000);
            checkNotify(hourBefore, '1h', `Deadline in 1 Hour: ${task.courseCode}`, `${task.title} is due soon!`);
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); 
    return () => clearInterval(interval);
  }, [state.schedule, state.tasks, state.preferences]);

  // State Helpers
  const updateSchedule = (newSchedule: ClassSession[]) => setState(prev => ({ ...prev, schedule: newSchedule }));
  const handleAddClass = (newClass: ClassSession) => setState(prev => ({ ...prev, schedule: [...prev.schedule, newClass] }));
  const handleDeleteClass = (id: string) => setState(prev => ({ ...prev, schedule: prev.schedule.filter(s => s.id !== id) }));
  const handleAddTask = (task: Task) => setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  const handleUpdateTask = (updatedTask: Task) => setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
  const handleDeleteTask = (id: string) => setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const updatePreferences = (newPrefs: Partial<AppPreferences>) => setState(prev => ({ ...prev, preferences: { ...prev.preferences, ...newPrefs } }));
  const updateNotificationSettings = (key: keyof AppPreferences['notificationSettings']) => {
      setState(prev => ({
          ...prev,
          preferences: {
              ...prev.preferences,
              notificationSettings: {
                  ...prev.preferences.notificationSettings,
                  [key]: !prev.preferences.notificationSettings[key]
              }
          }
      }));
  };

  const handleMasterToggle = () => {
    if (!state.preferences.enableNotifications && permissionStatus !== 'granted') {
        requestPermission();
    } else {
        updatePreferences({ enableNotifications: !state.preferences.enableNotifications });
    }
  };

  const handleReset = () => {
    const defaultSettings = { classReminders: true, taskDayBefore: true, taskDeadline: true, taskHourBefore: true };
    setState({ 
      schedule: [], 
      tasks: [], 
      preferences: { themeId: 'ocean', enableNotifications: true, notificationSettings: defaultSettings, showQuotes: true } 
    });
    localStorage.clear();
    applyTheme('ocean');
    setActiveTab('schedule');
  };

  // Logic: Only show permission prompt if:
  // 1. It is a standalone app (APK/PWA)
  // 2. Permission is not yet granted
  // 3. Notification API exists
  // 4. Welcome modal is NOT showing (to avoid double banners)
  const showPermissionBanner = !showWelcome && isStandalone && permissionStatus === 'default' && 'Notification' in window;

  // Logic: Show install prompt only if NOT standalone (browser)
  // But user asked to remove "In app alert". I'll keep this as a passive banner, 
  // but ensure it doesn't show if isStandalone is true (which handles the APK case via helpers.ts)
  const showInstallPrompt = !isStandalone && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-500 overflow-hidden">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex-none h-20">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-xl font-bold text-white">U</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">UniFlow</h1>
              <p className="text-xs text-slate-400">Smart Scheduler</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotificationSettings(true)}
              className={`p-2 rounded-full transition-all duration-300 relative group ${
                state.preferences.enableNotifications && permissionStatus === 'granted'
                  ? 'text-primary-400 bg-primary-500/10 hover:bg-primary-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {state.preferences.enableNotifications && permissionStatus === 'granted' ? (
                 <>
                   <Bell className="w-5 h-5" />
                   <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                 </>
              ) : (
                 <BellOff className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'text-primary-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-28 ${activeTab === 'tasks' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        
        {/* Permission Banner (Only shown if Installed/Standalone) */}
        {showPermissionBanner && (
          <div className="mb-6 p-4 bg-primary-600 rounded-xl shadow-lg shadow-primary-900/50 flex items-center justify-between animate-in slide-in-from-top-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-white/20 rounded-lg">
                 <BellRing className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-white">Enable Notifications</h3>
                 <p className="text-primary-100 text-sm">Get alerts for upcoming classes and deadlines.</p>
               </div>
             </div>
             <button 
               onClick={requestPermission}
               className="px-4 py-2 bg-white text-primary-600 font-bold rounded-lg hover:bg-primary-50 transition-colors text-sm"
             >
               Allow
             </button>
          </div>
        )}

        {/* Install Prompt (Only shown if NOT Installed/Standalone) */}
        {showInstallPrompt && (
           <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-start gap-4 animate-in slide-in-from-top-4">
              <div className="p-2 bg-slate-700 rounded-lg mt-1">
                 <Smartphone className="w-6 h-6 text-slate-300" />
              </div>
              <div className="flex-1 pr-6">
                 <h3 className="font-bold text-slate-200">Install App</h3>
                 <p className="text-slate-400 text-xs mt-1">
                    Notifications work best when installed on your device.
                 </p>
              </div>
           </div>
        )}

        {/* Views */}
        {activeTab === 'schedule' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {state.schedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center space-y-4 max-w-lg">
                  <h2 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 animate-float">
                    Your Semester, Organized.
                  </h2>
                  <p className="text-slate-400 text-lg">
                    Upload your university PDF routine.
                  </p>
                </div>
                <FileUpload onScheduleParsed={updateSchedule} />
              </div>
            ) : (
              <div className="space-y-6">
                 <ScheduleGrid 
                  schedule={state.schedule} 
                  onDeleteClass={handleDeleteClass} 
                  onAddClass={handleAddClass}
                 />
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            <TaskManager 
              schedule={state.schedule} 
              tasks={state.tasks} 
              showQuotes={state.preferences.showQuotes}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <Settings 
            preferences={state.preferences}
            schedule={state.schedule}
            tasks={state.tasks}
            onUpdatePreferences={updatePreferences}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-none">
        <nav className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-1.5 rounded-2xl shadow-2xl flex items-center justify-between gap-1 pointer-events-auto">
          <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={LayoutDashboard} label="Routine" />
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={ListTodo} label="Tasks" />
        </nav>
      </div>

      {/* Welcome / Permission Modal */}
      {showWelcome && (
       <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-300">
             <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-primary-500/10">
                <BellRing className="w-8 h-8 text-primary-400" />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">Never Miss a Class</h2>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">
               Allow notifications to get timely reminders for your classes and task deadlines, even when the app is in the background.
             </p>
             <button 
               onClick={() => handleWelcomeAction(true)}
               className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95 mb-3"
             >
               Enable Notifications
             </button>
             <button 
               onClick={() => handleWelcomeAction(false)}
               className="text-slate-500 hover:text-slate-300 text-sm font-medium p-2 transition-colors"
             >
               Skip for now
             </button>
          </div>
       </div>
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                     <Bell className="w-5 h-5 text-primary-400" />
                     Notification Preferences
                  </h3>
                  <button onClick={() => setShowNotificationSettings(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                  </button>
              </div>
              
              <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                      <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">Enable Notifications</span>
                          <span className="text-xs text-primary-200/70">System Alerts</span>
                      </div>
                      <button 
                        onClick={handleMasterToggle}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${state.preferences.enableNotifications ? 'bg-primary-500' : 'bg-slate-700'}`}
                      >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${state.preferences.enableNotifications ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  </div>

                  {state.preferences.enableNotifications && permissionStatus === 'granted' && (
                      <button onClick={sendTestNotification} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium border border-slate-700">
                          Send Test Notification
                      </button>
                  )}

                  {permissionStatus === 'denied' && (
                     <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-200 flex gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Permission denied in settings.</span>
                     </div>
                  )}

                  {/* Settings toggles... */}
                  <div className={`space-y-1 ${!state.preferences.enableNotifications ? 'opacity-50 pointer-events-none' : ''}`}>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Controls</h4>
                      
                      {/* Class Reminders */}
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Clock className="w-4 h-4" /></div>
                              <div><p className="text-sm font-medium text-slate-200">Class Reminders</p><p className="text-xs text-slate-400">30 mins before</p></div>
                          </div>
                          <button onClick={() => updateNotificationSettings('classReminders')} className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${state.preferences.notificationSettings.classReminders ? 'bg-blue-600' : 'bg-slate-700'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${state.preferences.notificationSettings.classReminders ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                      </div>

                       {/* Task: 1 Day Before */}
                       <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Calendar className="w-4 h-4" /></div>
                              <div><p className="text-sm font-medium text-slate-200">Task: 1 Day Before</p><p className="text-xs text-slate-400">Alert 24h before deadline</p></div>
                          </div>
                          <button onClick={() => updateNotificationSettings('taskDayBefore')} className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${state.preferences.notificationSettings.taskDayBefore ? 'bg-purple-600' : 'bg-slate-700'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${state.preferences.notificationSettings.taskDayBefore ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                      </div>

                      {/* Task: On Deadline Day */}
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
                              <div>
                                  <p className="text-sm font-medium text-slate-200">Task: On Deadline Day</p>
                                  <p className="text-xs text-slate-400">Alert at 12:00 AM</p>
                              </div>
                          </div>
                          <button 
                             onClick={() => updateNotificationSettings('taskDeadline')}
                             className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${state.preferences.notificationSettings.taskDeadline ? 'bg-orange-600' : 'bg-slate-700'}`}
                          >
                             <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${state.preferences.notificationSettings.taskDeadline ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      {/* Task: 1 Hour Before */}
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><Clock className="w-4 h-4" /></div>
                              <div>
                                  <p className="text-sm font-medium text-slate-200">Task: 1 Hour Before</p>
                                  <p className="text-xs text-slate-400">Final reminder</p>
                              </div>
                          </div>
                          <button 
                             onClick={() => updateNotificationSettings('taskHourBefore')}
                             className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${state.preferences.notificationSettings.taskHourBefore ? 'bg-red-600' : 'bg-slate-700'}`}
                          >
                             <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${state.preferences.notificationSettings.taskHourBefore ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;