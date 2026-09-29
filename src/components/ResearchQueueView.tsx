import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
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

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <span>Research & Verification Tasks</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated verification triggers for unverified corporate filings, contact discovery, and public record integrity checks.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{pendingCount} Pending Tasks</span>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading research tasks queue...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Pending Research Tasks</h3>
          <p className="text-xs text-slate-500">
            All current property records and corporate officer filings are fully verified.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-all"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                    {task.taskType}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      task.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {task.priority} PRIORITY
                  </span>

                  {task.status === 'COMPLETED' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      COMPLETED
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 truncate">
                  Target Entity: {task.targetEntityName}
                </h4>

                <p className="text-slate-600">{task.reason}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onSelectEntity(task.targetEntityName)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <span>Inspect Entity</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {task.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
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
