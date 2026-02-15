import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Check, X, Plus, Trash2, Save, Calendar, Clock, MapPin, User, GraduationCap } from 'lucide-react';
import { fileToBase64 } from '../utils/helpers';
import { parseScheduleFromPDF } from '../services/geminiService';
import { ClassSession, ProcessingStatus, DayOfWeek } from '../types';

interface FileUploadProps {
  onScheduleParsed: (schedule: ClassSession[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onScheduleParsed }) => {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, error: null, message: '' });
  
  // Review State
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewSchedule, setReviewSchedule] = useState<ClassSession[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setStatus({ isProcessing: false, error: "Please upload a PDF file.", message: '' });
      return;
    }

    setStatus({ isProcessing: true, error: null, message: 'Reading file...' });

    try {
      const base64 = await fileToBase64(file);
      setStatus({ isProcessing: true, error: null, message: 'Analyzing routine with AI...' });
      
      const rawData = await parseScheduleFromPDF(base64);
      
      const processedData: ClassSession[] = rawData.map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substring(2, 9),
      }));

      setReviewSchedule(processedData);
      setIsReviewing(true);
      setStatus({ isProcessing: false, error: null, message: 'Success!' });
    } catch (error: any) {
      console.error(error);
      // Show the actual error message if available
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const displayError = errorMessage.includes("API Key") 
        ? "API Key missing. Please check Vercel environment variables." 
        : `Failed to process PDF: ${errorMessage}`;
      
      setStatus({ isProcessing: false, error: displayError, message: '' });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpdateReview = (id: string, field: keyof ClassSession, value: string) => {
    setReviewSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDeleteReview = (id: string) => {
    setReviewSchedule(prev => prev.filter(item => item.id !== id));
  };

  const handleAddReview = () => {
    const newClass: ClassSession = {
      id: Math.random().toString(36).substring(2, 9),
      courseName: '',
      courseCode: '',
      faculty: '',
      room: '',
      day: DayOfWeek.Monday,
      startTime: '09:00',
      endTime: '10:30'
    };
    setReviewSchedule(prev => [newClass, ...prev]);
  };

  const handleConfirmReview = () => {
    // Filter out completely empty entries if necessary, or just trust user
    const finalSchedule = reviewSchedule.filter(s => s.courseCode || s.courseName);
    onScheduleParsed(finalSchedule);
    setIsReviewing(false);
    setReviewSchedule([]);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-10">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out
          ${dragActive ? 'border-primary-400 bg-primary-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}
          ${status.isProcessing ? 'opacity-80 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          {status.isProcessing ? (
             <div className="flex flex-col items-center">
               <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
               <p className="text-sm text-slate-300 font-medium animate-pulse">{status.message}</p>
             </div>
          ) : (
            <>
              <div className="p-4 bg-slate-800 rounded-full mb-4 shadow-lg shadow-black/20">
                <Upload className="w-8 h-8 text-primary-400" />
              </div>
              <p className="mb-2 text-lg text-slate-200 font-display font-medium">
                <span className="font-semibold text-primary-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400">PDF Routine (MAX 10MB)</p>
            </>
          )}
        </div>
        <input 
          id="dropzone-file" 
          type="file" 
          className="hidden" 
          accept="application/pdf"
          onChange={handleChange}
          disabled={status.isProcessing}
        />
        <label htmlFor="dropzone-file" className="absolute inset-0 cursor-pointer" />
      </div>

      {status.error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm break-words">{status.error}</span>
        </div>
      )}

      {/* Review Modal */}
      {isReviewing && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
           <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/50 backdrop-blur-xl z-10 gap-4">
                 <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                      <Check className="w-6 h-6 text-green-500" />
                      Review Schedule
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">We extracted <span className="text-white font-bold">{reviewSchedule.length}</span> classes. Verify details before importing.</p>
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => setIsReviewing(false)} 
                      className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium border border-transparent hover:border-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmReview} 
                      className="flex-1 md:flex-initial px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                       Confirm & Import
                    </button>
                 </div>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950/30 custom-scrollbar">
                  
                  {reviewSchedule.length === 0 && (
                    <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                      <p>No classes found in this PDF.</p>
                      <p className="text-sm">Click below to add manually.</p>
                    </div>
                  )}

                  <button 
                    onClick={handleAddReview} 
                    className="w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:border-primary-500/50 hover:text-primary-400 transition-all flex items-center justify-center gap-2 font-medium bg-slate-900/50 hover:bg-slate-900"
                  >
                      <Plus className="w-5 h-5" /> Add New Class
                  </button>

                  <div className="space-y-3">
                     {reviewSchedule.map((session, index) => (
                        <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 group hover:border-primary-500/30 transition-all shadow-sm">
                            <div className="grid grid-cols-2 md:grid-cols-12 gap-3 w-full items-start">
                                {/* Row 1 Mobile / Col 1 Desktop: Code (2 cols) */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1"><GraduationCap className="w-3 h-3"/> Code</label>
                                    <input 
                                      value={session.courseCode} 
                                      onChange={(e) => handleUpdateReview(session.id, 'courseCode', e.target.value)}
                                      placeholder="CSE101"
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-mono"
                                    />
                                </div>

                                {/* Row 1 Mobile / Col 2 Desktop: Name (2 cols) */}
                                <div className="col-span-2 md:col-span-2">
                                     <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1"><FileText className="w-3 h-3"/> Name</label>
                                     <input 
                                      value={session.courseName} 
                                      onChange={(e) => handleUpdateReview(session.id, 'courseName', e.target.value)}
                                      placeholder="Intro to CS"
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>

                                {/* NEW: Faculty (2 cols) */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1"><User className="w-3 h-3"/> Faculty</label>
                                    <input 
                                      value={session.faculty || ''} 
                                      onChange={(e) => handleUpdateReview(session.id, 'faculty', e.target.value)}
                                      placeholder="TBA"
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>

                                {/* Row 2 Mobile / Col 3 Desktop: Day (2 cols) */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3"/> Day</label>
                                    <select 
                                      value={session.day} 
                                      onChange={(e) => handleUpdateReview(session.id, 'day', e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all appearance-none"
                                    >
                                      {Object.values(DayOfWeek).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* Row 2 Mobile / Col 4 Desktop: Time (2 cols) */}
                                <div className="col-span-2 md:col-span-2 grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1"><Clock className="w-3 h-3"/> Start</label>
                                      <input 
                                        type="time"
                                        value={session.startTime} 
                                        onChange={(e) => handleUpdateReview(session.id, 'startTime', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1 py-2 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all [color-scheme:dark] text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block text-center">End</label>
                                      <input 
                                        type="time"
                                        value={session.endTime} 
                                        onChange={(e) => handleUpdateReview(session.id, 'endTime', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1 py-2 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all [color-scheme:dark] text-center"
                                      />
                                    </div>
                                </div>
                                
                                {/* Row 3 Mobile / Col 5 Desktop: Room & Actions (2 cols) */}
                                <div className="col-span-2 md:col-span-2 flex gap-2 items-end">
                                    <div className="flex-1">
                                      <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3"/> Room</label>
                                      <input 
                                        value={session.room} 
                                        onChange={(e) => handleUpdateReview(session.id, 'room', e.target.value)}
                                        placeholder="Room"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteReview(session.id)}
                                      className="h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all flex-shrink-0"
                                      title="Remove Class"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                     ))}
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;