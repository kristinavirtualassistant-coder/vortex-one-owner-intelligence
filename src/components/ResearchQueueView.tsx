import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { ResearchTask } from '../types';

interface ResearchQueueViewProps {
  onSelectEntity: (name: string) => void;
}

export const ResearchQueueView: React.FC<ResearchQueueViewProps> = ({ onSelectEntity }) => {
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/research-tasks');
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const handleCompleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/research-tasks/${id}/complete`, { method: 'POST' });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: 'COMPLETED' } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-600" />
            <span>Automated Research Tasks & Public Record Verification Queue</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Auto-generated research items for unverified corporate filings, missing contact discovery, or county clerk audits. Zero-fabrication enforcement.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-mono font-bold flex items-center gap-2 shadow-xs">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{tasks.filter((t) => t.status === 'PENDING').length} Pending Audit Tasks</span>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-sm">
          Loading research tasks queue...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-16 text-center bg-white border border-blue-200 rounded-3xl shadow-md space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Pending Research Tasks</h3>
          <p className="text-sm text-slate-600">All current property records and corporate officer filings are fully verified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-6 bg-white border border-blue-200 hover:border-blue-300 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-sm transition-all"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
                    {task.taskType}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      task.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {task.priority} PRIORITY
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 truncate font-sans">
                  Target Entity: {task.targetEntityName}
                </h4>

                <p className="text-slate-600 font-sans text-sm leading-relaxed">{task.reason}</p>
              </div>

              <div className="flex items-center space-x-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => onSelectEntity(task.targetEntityName)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {task.status === 'COMPLETED' ? (
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Completed
                  </span>
                ) : (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-xs"
                  >
                    Mark Verified
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
