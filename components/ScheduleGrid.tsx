import React, { useMemo, useState, useEffect } from 'react';
import { ClassSession, DayOfWeek } from '../types';
import { formatTime } from '../utils/helpers';
import { Clock, MapPin, User, Plus, X, Calendar as CalendarIcon, Timer } from 'lucide-react';

interface ScheduleGridProps {
  schedule: ClassSession[];
  onDeleteClass: (id: string) => void;
  onAddClass: (newClass: ClassSession) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, onDeleteClass, onAddClass }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time for "Up Next" widget
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sort days starting from Today
  const orderedDays = useMemo(() => {
    const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday...
    const dayMap: Record<number, DayOfWeek> = {
        0: DayOfWeek.Sunday,
        1: DayOfWeek.Monday,
        2: DayOfWeek.Tuesday,
        3: DayOfWeek.Wednesday,
        4: DayOfWeek.Thursday,
        5: DayOfWeek.Friday,
        6: DayOfWeek.Saturday
    };
    
    const days: DayOfWeek[] = [];
    for(let i = 0; i < 7; i++) {
        const index = (todayIndex + i) % 7;
        days.push(dayMap[index]);
    }
    return days;
  }, []);

  // Memoize grouped schedule
  const scheduleByDay = useMemo(() => {
    const grouped: Record<string, ClassSession[]> = {};
    Object.values(DayOfWeek).forEach(day => {
      grouped[day] = schedule
        .filter(s => s.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [schedule]);

  // "Up Next" Logic
  const getNextClass = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    const todaysClasses = scheduleByDay[today] || [];
    
    // Find class currently starting or coming up
    const upcoming = todaysClasses.find(c => {
      const [h, m] = c.startTime.split(':').map(Number);
      return (h * 60 + m) > currentMinutes;
    });

    const ongoing = todaysClasses.find(c => {
        const [sh, sm] = c.startTime.split(':').map(Number);
        const [eh, em] = c.endTime.split(':').map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        return currentMinutes >= start && currentMinutes < end;
    });

    return { upcoming, ongoing };
  };

  const { upcoming, ongoing } = getNextClass();

  const getClassColor = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-blue-500/20 border-blue-500/30 text-blue-100',
      'bg-purple-500/20 border-purple-500/30 text-purple-100',
      'bg-emerald-500/20 border-emerald-500/30 text-emerald-100',
      'bg-rose-500/20 border-rose-500/30 text-rose-100',
      'bg-amber-500/20 border-amber-500/30 text-amber-100',
      'bg-cyan-500/20 border-cyan-500/30 text-cyan-100',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  // Manual Add Form State
  const [newClass, setNewClass] = useState<Partial<ClassSession>>({
    day: DayOfWeek.Sunday,
    startTime: '09:00',
    endTime: '10:20'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClass.courseName && newClass.courseCode && newClass.startTime && newClass.endTime && newClass.day) {
        onAddClass({
            id: Math.random().toString(36).substring(2, 9),
            courseName: newClass.courseName,
            courseCode: newClass.courseCode,
            faculty: newClass.faculty || '',
            room: newClass.room || '',
            day: newClass.day,
            startTime: newClass.startTime,
            endTime: newClass.endTime,
        } as ClassSession);
        setShowAddModal(false);
        setNewClass({
            day: DayOfWeek.Sunday,
            startTime: '09:00',
            endTime: '10:20',
            courseName: '',
            courseCode: '',
            faculty: '',
            room: ''
        });
    }
  };

  if (schedule.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="text-xl font-display">No classes scheduled yet.</p>
        <p className="text-sm">Upload a PDF or add manually.</p>
        <button 
           onClick={() => setShowAddModal(true)}
           className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full text-sm font-medium transition-colors"
        >
           Add Class Manually
        </button>
        {showAddModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                   <AddClassForm 
                      newClass={newClass} 
                      setNewClass={setNewClass} 
                      onClose={() => setShowAddModal(false)} 
                      onSubmit={handleSubmit} 
                    />
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-[50vh]">
      {/* Up Next Dashboard Widget */}
      <div className="mb-8 grid gap-4">
        <div className="flex justify-between items-center px-2">
           <h2 className="text-2xl font-bold text-white font-display">Weekly Routine</h2>
           <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary-500/20"
           >
              <Plus className="w-4 h-4" /> Add Class
           </button>
        </div>

        {/* Live Status Card */}
        {(ongoing || upcoming) && (
            <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Timer className="w-32 h-32 text-primary-400" />
                </div>
                
                {ongoing ? (
                     <div>
                        <div className="flex items-center gap-2 text-primary-400 font-bold uppercase tracking-wider text-xs mb-1">
                            <span className="relative flex h-2.5 w-2.5 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                            </span>
                            Happening Now
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{ongoing.courseCode}</h3>
                        <p className="text-slate-300 text-lg mb-2">{ongoing.courseName}</p>
                        <div className="flex gap-4 text-sm text-slate-400">
                             <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {ongoing.room}</span>
                             <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Ends {formatTime(ongoing.endTime)}</span>
                        </div>
                     </div>
                ) : (
                    <div>
                         <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs mb-1">
                            <CalendarIcon className="w-3 h-3" />
                            Up Next
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{upcoming?.courseCode}</h3>
                        <p className="text-slate-300 text-lg mb-2">{upcoming?.courseName}</p>
                         <div className="flex gap-4 text-sm text-slate-400">
                             <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {upcoming?.room}</span>
                             <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Starts {formatTime(upcoming!.startTime)}</span>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {orderedDays.map((day, index) => {
          const classes = scheduleByDay[day] || [];
          if (classes.length === 0) return null;

          return (
            <div key={day} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              <h3 className={`text-xl font-display font-bold py-2 border-b flex items-center gap-2
                 ${index === 0 ? 'text-primary-400 border-primary-500/50' : 'text-slate-200 border-slate-800'}`}>
                {day}
                {index === 0 && <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>}
                <span className="ml-auto text-xs font-sans font-normal text-slate-500 bg-slate-900 px-2 py-1 rounded-full">
                  {classes.length}
                </span>
              </h3>
              
              <div className="flex flex-col gap-3">
                {classes.map(session => (
                  <div 
                    key={session.id} 
                    className={`relative group p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${getClassColor(session.courseCode)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-70 bg-black/20 px-2 py-0.5 rounded">
                        {session.courseCode}
                      </span>
                      <button 
                        onClick={() => onDeleteClass(session.id)}
                        className="text-xs opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                    
                    <h4 className="font-bold text-lg leading-tight mb-1 line-clamp-2" title={session.courseName}>
                      {session.courseName}
                    </h4>
                    
                    <div className="mt-4 space-y-2 text-sm opacity-90">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                      </div>
                      
                      {session.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{session.room}</span>
                        </div>
                      )}
                      
                      {session.faculty && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{session.faculty}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                 <AddClassForm 
                   newClass={newClass} 
                   setNewClass={setNewClass} 
                   onClose={() => setShowAddModal(false)} 
                   onSubmit={handleSubmit} 
                 />
             </div>
        </div>
      )}
    </div>
  );
};

// Extracted Form Component for reusability
const AddClassForm = ({ newClass, setNewClass, onClose, onSubmit }: any) => (
    <>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Add Class Manually</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
            </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Course Code</label>
                <input 
                    type="text" required placeholder="e.g. CSE101"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newClass.courseCode}
                    onChange={e => setNewClass({...newClass, courseCode: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Course Name</label>
                <input 
                    type="text" required placeholder="e.g. Introduction to Programming"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newClass.courseName}
                    onChange={e => setNewClass({...newClass, courseName: e.target.value})}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Room</label>
                    <input 
                        type="text" placeholder="e.g. UB201"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={newClass.room}
                        onChange={e => setNewClass({...newClass, room: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Faculty</label>
                    <input 
                        type="text" placeholder="e.g. JD"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={newClass.faculty}
                        onChange={e => setNewClass({...newClass, faculty: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Day</label>
                <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newClass.day}
                    onChange={e => setNewClass({...newClass, day: e.target.value})}
                >
                    {Object.values(DayOfWeek).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Start Time</label>
                    <input 
                        type="time" required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]"
                        value={newClass.startTime}
                        onChange={e => setNewClass({...newClass, startTime: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">End Time</label>
                    <input 
                        type="time" required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]"
                        value={newClass.endTime}
                        onChange={e => setNewClass({...newClass, endTime: e.target.value})}
                    />
                </div>
            </div>
            <button 
                type="submit" 
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-xl transition-colors mt-4"
            >
                Add Class
            </button>
        </form>
    </>
);

export default ScheduleGrid;