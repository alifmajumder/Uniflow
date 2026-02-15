import React, { useState } from 'react';
import { Mail, Copy, Check, Palette, Smartphone, Sparkles, Quote, Trash2, AlertTriangle, X, Download } from 'lucide-react';
import { AppPreferences, ClassSession, Task } from '../types';
import { themes, exportData } from '../utils/helpers';

interface SettingsProps {
  preferences: AppPreferences;
  schedule: ClassSession[];
  tasks: Task[];
  onUpdatePreferences: (newPrefs: Partial<AppPreferences>) => void;
  onReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ preferences, schedule, tasks, onUpdatePreferences, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('alifmajumer2002@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmReset = () => {
    onReset();
    setShowResetModal(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Theme Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl font-display font-bold">Appearance</h2>
        </div>
        
        <div className="glass-card p-6 rounded-2xl">
          <label className="block text-sm text-slate-400 mb-4 font-medium uppercase tracking-wider">Accent Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onUpdatePreferences({ themeId: theme.id })}
                className={`relative group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200
                  ${preferences.themeId === theme.id 
                    ? 'bg-slate-800 border-primary-500 ring-2 ring-primary-500/20' 
                    : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                  }`}
              >
                <div 
                  className="w-10 h-10 rounded-full shadow-lg mb-1 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: theme.previewColor }}
                />
                <span className={`text-xs font-medium ${preferences.themeId === theme.id ? 'text-white' : 'text-slate-400'}`}>
                  {theme.name}
                </span>
                {preferences.themeId === theme.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl font-display font-bold">Preferences</h2>
        </div>
        
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-800">
          
          {/* Quotes */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Quote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-200">Motivational Quotes</h4>
                <p className="text-sm text-slate-400">Show productivity tips in task manager</p>
              </div>
            </div>
            <button 
              onClick={() => onUpdatePreferences({ showQuotes: !preferences.showQuotes })}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${preferences.showQuotes ? 'bg-primary-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${preferences.showQuotes ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-2 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-display font-bold text-slate-200">Danger Zone</h2>
        </div>

        <div className="glass-card p-6 rounded-2xl border-red-500/20 bg-red-500/5">
            <h4 className="font-bold text-slate-200 mb-2">Reset Application</h4>
            <p className="text-sm text-slate-400 mb-4">
                This will erase all your schedules, tasks, and preferences. This action cannot be undone.
            </p>
            <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all"
            >
                <Trash2 className="w-4 h-4" />
                Reset All Data
            </button>
        </div>
      </section>

      {/* Developer Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl font-display font-bold">About Developer</h2>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-600 flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary-500/20">
            AM
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
             <h3 className="text-xl font-bold">Alif Majumder</h3>
             <p className="text-slate-400 text-sm">Student - Brac University</p>
             <div className="pt-2">
               <button 
                 onClick={handleCopyEmail}
                 className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all active:scale-95"
               >
                 <Mail className="w-4 h-4" />
                 alifmajumer2002@gmail.com
                 {copied ? <Check className="w-4 h-4 text-green-400 ml-2" /> : <Copy className="w-4 h-4 ml-2 opacity-50" />}
               </button>
             </div>
          </div>
        </div>
      </section>

      <div className="text-center pt-8">
        <p className="text-xs text-slate-600 font-mono">UniFlow Version : 1.0 • Made with ❤️</p>
      </div>

       {/* Reset Modal */}
       {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Confirm Reset
                    </h3>
                    <button onClick={() => setShowResetModal(false)} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-300">
                        Are you sure you want to erase everything? You will lose your routine and tasks.
                    </p>
                    <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-xl flex items-start gap-3">
                         <div className="p-2 bg-primary-500/20 rounded-full text-primary-400">
                            <Download className="w-4 h-4" />
                         </div>
                         <div>
                             <h4 className="font-bold text-primary-100 text-sm">Recommendation</h4>
                             <p className="text-xs text-primary-200/70 mb-2">Download a backup of your current routine before resetting.</p>
                             <button
                                onClick={() => exportData(schedule, tasks)}
                                className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                             >
                                <Download className="w-3 h-3" /> Download Backup
                             </button>
                         </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-950/50 flex gap-3">
                    <button
                        onClick={() => setShowResetModal(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmReset}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 transition-colors"
                    >
                        Yes, Erase Everything
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Settings;