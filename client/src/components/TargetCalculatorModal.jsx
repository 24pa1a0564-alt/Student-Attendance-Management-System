import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { Calculator, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const TargetCalculatorModal = ({
  isOpen,
  onClose,
  initialAttended = 0,
  initialTotal = 0,
  subjectName = 'Overall Attendance',
}) => {
  const [attended, setAttended] = useState(initialAttended);
  const [total, setTotal] = useState(initialTotal);
  const [target, setTarget] = useState(85);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateTarget = async (overrideTarget) => {
    const targetVal = overrideTarget !== undefined ? overrideTarget : target;
    setError('');
    setLoading(true);

    try {
      const res = await api.get('/attendance/target-calculator', {
        params: {
          attended,
          total,
          target: targetVal,
        },
      });

      if (res.data.success && res.data.data.isValid) {
        setResult(res.data.data);
      } else {
        setError(res.data.data.message || 'Calculation error');
        setResult(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate target');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChip = (val) => {
    setTarget(val);
    calculateTarget(val);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attendance Target Calculator" maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600 text-white shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950">{subjectName}</h4>
            <p className="text-xs text-indigo-700 mt-0.5">
              Determine the exact number of consecutive classes required to reach your target attendance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Classes Attended</label>
            <input
              type="number"
              min="0"
              value={attended}
              onChange={(e) => setAttended(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Total Classes Held</label>
            <input
              type="number"
              min="0"
              value={total}
              onChange={(e) => setTotal(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Target Percentage (%)</label>
          <div className="flex gap-2 mb-2">
            {[75, 80, 85, 90, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickChip(val)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all ${
                  target === val
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            max="100"
            value={target}
            onChange={(e) => setTarget(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            placeholder="Custom target %"
          />
        </div>

        <button
          type="button"
          onClick={() => calculateTarget()}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Required Classes'}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-slate-200">
              <span>Current: {result.currentPercentage}%</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-indigo-600 font-bold">Target: {result.targetPercentage}%</span>
            </div>

            {result.isPossible ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-extrabold text-indigo-600">
                    +{result.requiredClasses}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Additional classes to attend
                    </p>
                    <p className="text-xs text-slate-500">
                      Projected attendance: <span className="font-bold text-emerald-600">{result.projectedPercentage}%</span>
                    </p>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{result.message}</span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{result.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TargetCalculatorModal;
