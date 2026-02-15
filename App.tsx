import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ListTodo, Settings as SettingsIcon } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ScheduleGrid from './components/ScheduleGrid';
import TaskManager from './components/TaskManager';
import Settings from './components/Settings';
import { AppState, ClassSession, Task, AppPreferences } from './types';
import { loadSchedule, loadTasks, saveSchedule, saveTasks, loadPreferences, savePreferences, applyTheme } from './utils/helpers';

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
      showQuotes: true
    }
  });

  // Initialize
  useEffect(() => {
    const prefs = loadPreferences();
    setState({
      schedule: loadSchedule(),
      tasks: loadTasks(),
      preferences: prefs
    });
    
    applyTheme(prefs.themeId);
  }, []);

  // Persistence
  useEffect(() => { saveSchedule(state.schedule); }, [state.schedule]);
  useEffect(() => { saveTasks(state.tasks); }, [state.tasks]);
  useEffect(() => { 
    savePreferences(state.preferences); 
    applyTheme(state.preferences.themeId);
  }, [state.preferences]);

  // State Helpers
  const updateSchedule = (newSchedule: ClassSession[]) => setState(prev => ({ ...prev, schedule: newSchedule }));
  const handleAddClass = (newClass: ClassSession) => setState(prev => ({ ...prev, schedule: [...prev.schedule, newClass] }));
  const handleDeleteClass = (id: string) => setState(prev => ({ ...prev, schedule: prev.schedule.filter(s => s.id !== id) }));
  const handleAddTask = (task: Task) => setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  const handleUpdateTask = (updatedTask: Task) => setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
  const handleDeleteTask = (id: string) => setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const updatePreferences = (newPrefs: Partial<AppPreferences>) => setState(prev => ({ ...prev, preferences: { ...prev.preferences, ...newPrefs } }));

  const handleReset = () => {
    setState({ 
      schedule: [], 
      tasks: [], 
      preferences: { themeId: 'ocean', showQuotes: true } 
    });
    localStorage.clear();
    applyTheme('ocean');
    setActiveTab('schedule');
  };

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
    </div>
  );
};

export default App;