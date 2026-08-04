import { useState, useCallback, useEffect } from "react";
import { Sprout, Loader2, RefreshCw, Brain, AlertTriangle } from "lucide-react";
import axiosInstance from "../../../axiosInstance";

export default function CropPredictionPanel({ entityId, entityType = "farm", isAdmin = false }) {
  const [prediction, setPrediction] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/sentinel/crop-model/status');
      setModelStatus(data);
    } catch { /* silencieux */ }
  }, []);

  const fetchPrediction = useCallback(async () => {
    if (!entityId || entityType !== 'farm') { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await axiosInstance.get(`/api/sentinel/farm/${entityId}/predict-crop`);
      setPrediction(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { fetchStatus(); fetchPrediction(); }, [fetchStatus, fetchPrediction]);

  const handleTrain = async () => {
    setTraining(true); setError(null);
    try {
      const { data } = await axiosInstance.post('/api/sentinel/crop-model/train', { fetch_missing: false });
      setModelStatus({ trained: true, metrics: data.metrics, trained_at: new Date().toISOString() });
      fetchPrediction();
    } catch (e) {
      setError(e.response?.data?.error || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  if (entityType !== 'farm') return null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Sprout size={16} className="text-emerald-400" />
            Crop Type Prediction (Random Forest — 100% NKUSU)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Signature spectrale (NDVI/EVI/NDMI/...) comparée aux fermes déjà labellisées.
            {modelStatus?.trained && (
              <span className="ml-1 text-slate-600">
                · modèle entraîné sur {modelStatus.metrics?.n_samples} fermes, {modelStatus.metrics?.n_classes} cultures
                {modelStatus.metrics?.oob_score != null && ` · OOB ${(modelStatus.metrics.oob_score * 100).toFixed(1)}%`}
              </span>
            )}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleTrain}
            disabled={training}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50
                       text-white text-sm px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            {training ? <Loader2 size={13} className="animate-spin" /> : <Brain size={13} />}
            {training ? 'Entraînement…' : 'Entraîner le modèle'}
          </button>
        )}
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={16} className="animate-spin" /> Analyse de la signature spectrale…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-orange-700/40 bg-orange-950/20 p-4 flex items-start gap-2">
            <AlertTriangle size={15} className="text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-orange-400 text-sm">{error}</p>
              {isAdmin && error.toLowerCase().includes('not trained') && (
                <button onClick={handleTrain} className="text-xs text-orange-300 underline mt-1">
                  Entraîner maintenant
                </button>
              )}
            </div>
          </div>
        )}

        {prediction && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-emerald-700/30 bg-emerald-950/20 p-5">
              <div>
                <p className="text-xs text-emerald-400 uppercase tracking-wide font-bold">Culture prédite</p>
                <p className="text-2xl font-black text-white mt-1">{prediction.predicted_crop || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Confiance</p>
                <p className="text-3xl font-black text-emerald-400">{prediction.confidence}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Top 3 candidats</p>
              {prediction.top_predictions?.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24 truncate">{p.crop}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${p.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400 w-12 text-right">{p.confidence}%</span>
                </div>
              ))}
            </div>

            <button
              onClick={fetchPrediction}
              className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs transition-colors"
            >
              <RefreshCw size={11} /> Recalculer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}