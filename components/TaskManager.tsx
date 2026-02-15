import React, { useState, useEffect, useMemo } from 'react';
import { ClassSession, Task } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, Tag, Play, Pause, X, Timer as TimerIcon, ChevronUp, ChevronDown, Pencil } from 'lucide-react';

interface TaskManagerProps {
  schedule: ClassSession[];
  tasks: Task[];
  showQuotes: boolean;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ schedule, tasks, showQuotes, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  
  // Custom Time State (Defaults to 11:59 PM)
  const [timeState, setTimeState] = useState<{hour: number, minute: number, ampm: 'AM' | 'PM'}>({ 
    hour: 11, 
    minute: 59, 
    ampm: 'PM' 
  });

  // Focus Timer State
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      // Optional: Play sound here
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const startFocusSession = (task: Task) => {
      setFocusTask(task);
      setTimeLeft(60 * 60);
      setIsTimerRunning(true);
  };

  const closeFocusSession = () => {
      setIsTimerRunning(false);
      setFocusTask(null);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const adjustTime = (field: 'hour' | 'minute' | 'ampm', direction: 'up' | 'down') => {
    setTimeState(prev => {
        if (field === 'hour') {
            const newHour = direction === 'up' 
                ? (prev.hour === 12 ? 1 : prev.hour + 1)
                : (prev.hour === 1 ? 12 : prev.hour - 1);
            return { ...prev, hour: newHour };
        }
        if (field === 'minute') {
            const newMinute = direction === 'up'
                ? (prev.minute === 59 ? 0 : prev.minute + 1)
                : (prev.minute === 0 ? 59 : prev.minute - 1);
            return { ...prev, minute: newMinute };
        }
        if (field === 'ampm') {
            return { ...prev, ampm: prev.ampm === 'AM' ? 'PM' : 'AM' };
        }
        return prev;
    });
  };

  // Get unique courses
  const uniqueCourses = Array.from(new Set(schedule.map(s => JSON.stringify({ name: s.courseName, code: s.courseCode }))))
    .map((str: string) => JSON.parse(str));

  const openAddModal = () => {
      setEditingTaskId(null);
      setSelectedCourse('');
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDate('');
      setTimeState({ hour: 11, minute: 59, ampm: 'PM' });
      setShowAddModal(true);
  };

  const openEditModal = (task: Task) => {
      setEditingTaskId(task.id);
      setSelectedCourse(task.courseCode);
      setNewTaskTitle(task.title);
      setNewTaskDescription(task.description);
      
      if (task.deadline) {
          const d = new Date(task.deadline);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          setNewTaskDate(`${year}-${month}-${day}`);
          
          let h = d.getHours();
          const m = d.getMinutes();
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          h = h ? h : 12;
          
          setTimeState({ hour: h, minute: m, ampm });
      } else {
          setNewTaskDate('');
          setTimeState({ hour: 11, minute: 59, ampm: 'PM' });
      }
      
      setShowAddModal(true);
  };

  const handleSaveTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCourse || !newTaskTitle) return;

    let deadlineIso = '';
    if (newTaskDate) {
        // Construct 24h time from custom state
        let h = timeState.hour;
        if (timeState.ampm === 'PM' && h < 12) h += 12;
        if (timeState.ampm === 'AM' && h === 12) h = 0;
        
        const [year, month, day] = newTaskDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day, h, timeState.minute);
        deadlineIso = dateObj.toISOString();
    }

    if (editingTaskId) {
        // Update existing task
        const existingTask = tasks.find(t => t.id === editingTaskId);
        if (existingTask) {
             onUpdateTask({
                 ...existingTask,
                 courseCode: selectedCourse,
                 title: newTaskTitle,
                 description: newTaskDescription,
                 deadline: deadlineIso
             });
        }
    } else {
        // Create new task
        const task: Task = {
            id: Math.random().toString(36).substring(2, 9),
            courseCode: selectedCourse,
            title: newTaskTitle,
            description: newTaskDescription,
            deadline: deadlineIso,
            completed: false,
            priority: 'medium',
        };
        onAddTask(task);
    }

    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDate('');
    setTimeState({ hour: 11, minute: 59, ampm: 'PM' });
    setShowAddModal(false);
    setEditingTaskId(null);
  };

  const toggleTask = (task: Task) => {
    onUpdateTask({ ...task, completed: !task.completed });
  };

  const getCourseName = (code: string) => {
    const course = uniqueCourses.find((c: any) => c.code === code);
    return course ? course.name : code;
  };

  const formatDeadline = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Sort tasks: Active first, then by deadline (earliest first)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // 1. Completion status: Incomplete first
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      
      // 2. Deadline: Earliest first
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; // No deadline goes last
      if (!b.deadline) return -1;
      
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tasks]);

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Tasks & Deadlines</h2>
          <p className="text-slate-400 text-sm">Manage your academic workload.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        <div className="grid gap-3">
          {sortedTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 bg-slate-900/20">
               <Tag className="w-10 h-10 mb-3 opacity-20" />
               <p>No tasks yet.</p>
               <button onClick={openAddModal} className="mt-2 text-primary-400 hover:text-primary-300 text-sm font-medium">
                 Create your first task
               </button>
             </div>
          ) : (
            sortedTasks.map(task => (
              <div 
                key={task.id} 
                className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 
                  ${task.completed ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-800/40 border-slate-700 hover:border-primary-500/50 hover:bg-slate-800/60'}
                `}
              >
                <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 ${task.completed ? 'hidden' : ''}`}>
                    <button 
                      onClick={() => openEditModal(task)}
                      className="p-1.5 bg-slate-800 text-slate-400 border border-slate-700 hover:bg-primary-500 hover:text-white hover:border-primary-500 rounded-lg transition-all active:scale-95"
                      title="Edit Task"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => startFocusSession(task)}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                      title="Start Focus Timer"
                    >
                        <TimerIcon className="w-3.5 h-3.5" /> Study
                    </button>
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 bg-slate-800 text-slate-400 border border-slate-700 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-lg transition-all active:scale-95"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <button onClick={() => toggleTask(task)} className="text-slate-400 hover:text-primary-400 transition-colors mt-1">
                  {task.completed ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
                </button>

                <div className="flex-1 min-w-0 pr-24 sm:pr-32">
                  <div className="flex flex-col gap-1 mb-2">
                     <h4 className={`font-medium text-slate-200 truncate ${task.completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                     </h4>
                     {task.description && (
                       <p className={`text-sm text-slate-400 line-clamp-2 ${task.completed ? 'text-slate-600' : ''}`}>
                         {task.description}
                       </p>
                     )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-400">
                      {task.courseCode}
                    </span>
                    <span className="truncate max-w-[150px] sm:max-w-[200px] hidden sm:block border-l border-slate-700 pl-3">{getCourseName(task.courseCode)}</span>
                    {task.deadline && (
                      <span className={`flex items-center gap-1 ml-auto sm:ml-0 ${new Date(task.deadline) < new Date() && !task.completed ? 'text-red-400 font-bold' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        {formatDeadline(task.deadline)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showQuotes && (
          <div className="mt-8 bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm font-medium text-slate-300">Productivity Tip</p>
            </div>
            <p className="text-xs text-slate-400 italic">"Focus on one thing at a time. Multitasking lowers IQ points!"</p>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 backdrop-blur-md z-10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="p-1.5 bg-primary-500/10 rounded-lg text-primary-500">
                      {editingTaskId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>
                    {editingTaskId ? 'Edit Task' : 'Add New Task'}
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                  </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                 <form onSubmit={handleSaveTask} className="flex flex-col gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Course</label>
                      <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        required
                      >
                        <option value="" disabled>Choose a course...</option>
                        {uniqueCourses.map((c: any) => (
                          <option key={c.code} value={c.code}>
                            {c.code === c.name ? c.code : `${c.code} - ${c.name}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Task Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Submit Assignment 2"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Description / Syllabus (Optional)</label>
                      <textarea 
                        placeholder="e.g. Chapter 4, 5 and lecture notes..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all min-h-[100px] resize-none"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Due Date</label>
                          <input 
                            type="date" 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all [color-scheme:dark]"
                            value={newTaskDate}
                            onChange={(e) => setNewTaskDate(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Time</label>
                          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 justify-center h-[46px]">
                            {/* Hour */}
                            <div className="flex flex-col items-center">
                              <button type="button" onClick={() => adjustTime('hour', 'up')} className="text-slate-500 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                              <span className="font-mono font-bold text-white text-lg leading-none w-8 text-center">{timeState.hour.toString().padStart(2, '0')}</span>
                              <button type="button" onClick={() => adjustTime('hour', 'down')} className="text-slate-500 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                            <span className="text-slate-600 font-bold mb-0.5">:</span>
                            {/* Minute */}
                            <div className="flex flex-col items-center">
                              <button type="button" onClick={() => adjustTime('minute', 'up')} className="text-slate-500 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                              <span className="font-mono font-bold text-white text-lg leading-none w-8 text-center">{timeState.minute.toString().padStart(2, '0')}</span>
                              <button type="button" onClick={() => adjustTime('minute', 'down')} className="text-slate-500 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                            {/* AM/PM */}
                            <div className="flex flex-col items-center ml-1">
                              <button type="button" onClick={() => adjustTime('ampm', 'up')} className="text-slate-500 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                              <span className="font-mono font-bold text-primary-400 text-xs leading-none w-6 text-center">{timeState.ampm}</span>
                              <button type="button" onClick={() => adjustTime('ampm', 'down')} className="text-slate-500 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                          </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary-500/20"
                    >
                      {editingTaskId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingTaskId ? 'Save Changes' : 'Add Task'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* Focus Mode Overlay */}
      {focusTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="flex flex-col items-center justify-center max-w-lg w-full text-center">
               <button onClick={closeFocusSession} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                   <X className="w-8 h-8" />
               </button>

               <div className="mb-8">
                   <h2 className="text-sm text-primary-400 font-bold uppercase tracking-widest mb-2">Focus Mode</h2>
                   <h1 className="text-3xl font-display font-bold text-white mb-2">{focusTask.title}</h1>
                   <p className="text-slate-400 text-lg">{focusTask.courseCode} - {getCourseName(focusTask.courseCode)}</p>
               </div>

               <div className="w-72 h-72 rounded-full border-4 border-slate-800 bg-slate-900/50 flex items-center justify-center relative mb-12 shadow-[0_0_50px_rgba(14,165,233,0.15)]">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                       <circle 
                         cx="50" cy="50" r="46" 
                         fill="none" 
                         stroke="currentColor" 
                         strokeWidth="4" 
                         className="text-slate-800"
                       />
                       <circle 
                         cx="50" cy="50" r="46" 
                         fill="none" 
                         stroke="currentColor" 
                         strokeWidth="4" 
                         strokeDasharray="289.026" 
                         strokeDashoffset={289.026 - (289.026 * timeLeft) / (60 * 60)}
                         className="text-primary-500 transition-all duration-1000 ease-linear"
                       />
                    </svg>
                    <div className="text-6xl font-mono font-bold text-white tracking-tighter">
                        {formatTimer(timeLeft)}
                    </div>
               </div>

               <div className="flex gap-4">
                   <button 
                     onClick={() => setIsTimerRunning(!isTimerRunning)}
                     className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 ${isTimerRunning ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'}`}
                   >
                       {isTimerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                   </button>
               </div>
               
               <p className="mt-8 text-slate-500 text-sm">Don't break the chain. Stay focused.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;