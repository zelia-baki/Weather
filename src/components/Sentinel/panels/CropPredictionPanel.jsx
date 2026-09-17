import { useState, useCallback, useEffect } from "react";
import { Sprout, Loader2, RefreshCw, Brain, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import axiosInstance from "../../../axiosInstance";

export default function CropPredictionPanel({
  entityId, entityType = "farm", isAdmin = false,
  isGuest = false, geojson = null, phone = null,
}) {
  const [prediction, setPrediction] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);

  // ── Confirmation (training bank) — not available for guests: there's no
  // permanent farm_id to attach the confirmation to. ───────────────────────
  const [crops, setCrops] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedCropId, setCorrectedCropId] = useState("");

  useEffect(() => {
    if (isGuest) return;
    axiosInstance.get('/api/crop/')
      .then(({ data }) => setCrops(data.crops || []))
      .catch(() => {});
  }, [isGuest]);

  const submitConfirmation = async (cropId) => {
    if (!cropId) return;
    setConfirming(true); setError(null);
    try {
      await axiosInstance.post(`/api/sentinel/farm/${entityId}/confirm-crop`, {
        crop_id: cropId,
        predicted_crop: prediction?.predicted_crop,
        confidence: prediction?.confidence,
      });
      setConfirmed(true);
      setShowCorrection(false);
    } catch (e) {
      setError(e.response?.data?.error || 'Confirmation failed');
    } finally {
      setConfirming(false);
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/sentinel/crop-model/status');
      setModelStatus(data);
    } catch { /* silent */ }
  }, []);

  const fetchPrediction = useCallback(async () => {
    if (isGuest) {
      if (!geojson || !phone) { setLoading(false); return; }
    } else if (!entityId || entityType !== 'farm') {
      setLoading(false); return;
    }
    setLoading(true); setError(null);
    setConfirmed(false); setShowCorrection(false); setCorrectedCropId("");
    try {
      const { data } = isGuest
        ? await axiosInstance.post('/api/sentinel/guest/predict-crop', { geojson, phone })
        : await axiosInstance.get(`/api/sentinel/farm/${entityId}/predict-crop`);
      setPrediction(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, isGuest, geojson, phone]);

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

  if (!isGuest && entityType !== 'farm') return null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Sprout size={16} className="text-emerald-400" />
            Crop Type Prediction (Random Forest — 100% NKUSU)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Spectral signature (NDVI/EVI/NDMI/...) compared against already-labeled farms.
            {modelStatus?.trained && (
              <span className="ml-1 text-slate-600">
                · model trained on {modelStatus.metrics?.n_samples} farms, {modelStatus.metrics?.n_classes} crops
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
            {training ? 'Training…' : 'Train Model'}
          </button>
        )}
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={16} className="animate-spin" /> Analyzing spectral signature…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-orange-700/40 bg-orange-950/20 p-4 flex items-start gap-2">
            <AlertTriangle size={15} className="text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-orange-400 text-sm">{error}</p>
              {isAdmin && error.toLowerCase().includes('not trained') && (
                <button onClick={handleTrain} className="text-xs text-orange-300 underline mt-1">
                  Train now
                </button>
              )}
            </div>
          </div>
        )}

        {prediction && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-emerald-700/30 bg-emerald-950/20 p-5">
              <div>
                <p className="text-xs text-emerald-400 uppercase tracking-wide font-bold">Predicted Crop</p>
                <p className="text-2xl font-black text-white mt-1">{prediction.predicted_crop || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Confidence</p>
                <p className="text-3xl font-black text-emerald-400">{prediction.confidence}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Top 3 Candidates</p>
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

            {/* ── Human confirmation → training bank — account users only:
                guests have no permanent farm_id to attach a confirmation to. ── */}
            {!isGuest && (confirmed ? (
              <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/30 p-3 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300">
                  Confirmed — this farm will be used in the next model training run.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Is this crop correct? Confirming it adds this farm to the data bank
                  used to train the model.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => submitConfirmation(prediction.predicted_crop_id)}
                    disabled={confirming || !prediction.predicted_crop_id}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50
                               text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {confirming ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Confirm "{prediction.predicted_crop}"
                  </button>
                  <button
                    onClick={() => setShowCorrection((v) => !v)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
                  >
                    <Pencil size={11} /> This isn't the right crop
                  </button>
                </div>

                {showCorrection && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <select
                      value={correctedCropId}
                      onChange={(e) => setCorrectedCropId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5"
                    >
                      <option value="">Choose the actual crop…</option>
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => submitConfirmation(correctedCropId)}
                      disabled={confirming || !correctedCropId}
                      className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50
                                 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      {confirming ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Confirm this crop
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={fetchPrediction}
              className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs transition-colors"
            >
              <RefreshCw size={11} /> Recalculate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}