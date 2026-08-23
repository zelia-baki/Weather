import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../axiosInstance';

const CURRENCIES = ['UGX', 'USD', 'KES', 'TZS', 'ZAR'];
const STATUS_STYLES = {
  success: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-600',
};

const INPUT_CLASSES =
  'w-full border border-gray-400 bg-white text-gray-900 placeholder-gray-400 rounded-lg p-2.5 text-sm ' +
  'focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors';

const LABEL_CLASSES = 'block text-xs font-medium text-gray-700 mb-1';

const emptyFeatureForm = {
  feature_name: '',
  duration_days: '',
  usage_limit: '',
  description: '',
  default_currency: 'UGX',
  prices: [{ currency: 'UGX', amount: '' }],
};

const emptyAccessForm = {
  user_id: '',
  guest_phone_number: '',
  feature_name: '',
  txn_id: '',
  payment_status: 'pending',
  access_expires_at: '',
  usage_left: '',
};

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
        isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
      }`}
    >
      {toast.message}
    </div>
  );
}

function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

const FeatureManager = () => {
  const [featurePrices, setFeaturePrices] = useState([]);
  const [accessRecords, setAccessRecords] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [featureForm, setFeatureForm] = useState(emptyFeatureForm);
  const [editingFeatureId, setEditingFeatureId] = useState(null);
  const [savingFeature, setSavingFeature] = useState(false);

  const [accessForm, setAccessForm] = useState(emptyAccessForm);
  const [editingAccessId, setEditingAccessId] = useState(null);
  const [savingAccess, setSavingAccess] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);

  const [accessSearch, setAccessSearch] = useState('');
  const [accessStatusFilter, setAccessStatusFilter] = useState('all');

  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAll = async () => {
    setLoadingLists(true);
    try {
      const [pricesRes, accessRes] = await Promise.all([
        axiosInstance.get('/api/feature/price/'),
        axiosInstance.get('/api/feature/access/'),
      ]);
      setFeaturePrices(pricesRes.data);
      setAccessRecords(accessRes.data);
    } catch (err) {
      showToast('Failed to load data. Please refresh.', 'error');
    } finally {
      setLoadingLists(false);
    }
  };

  // ── Feature price form handlers ──────────────────────────────────────────

  const handleFeatureField = (e) => {
    const { name, value } = e.target;
    setFeatureForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceRowChange = (index, field, value) => {
    setFeatureForm((prev) => {
      const prices = [...prev.prices];
      const oldCurrency = prices[index].currency;
      prices[index] = { ...prices[index], [field]: value };

      // Si on change la devise de la ligne qui était "Default", le
      // default_currency doit suivre — sinon il pointe vers une devise
      // qui n'existe plus dans le formulaire.
      let default_currency = prev.default_currency;
      if (field === 'currency' && prev.default_currency === oldCurrency) {
        default_currency = value;
      }

      return { ...prev, prices, default_currency };
    });
  };

  const addPriceRow = () => {
    setFeatureForm((prev) => {
      const usedCurrencies = new Set(prev.prices.map((p) => p.currency));
      const nextCurrency = CURRENCIES.find((c) => !usedCurrencies.has(c)) || '';
      return { ...prev, prices: [...prev.prices, { currency: nextCurrency, amount: '' }] };
    });
  };

  const removePriceRow = (index) => {
    setFeatureForm((prev) => {
      if (prev.prices.length <= 1) return prev; // toujours garder au moins une ligne
      const prices = prev.prices.filter((_, i) => i !== index);
      const removedCurrency = prev.prices[index].currency;
      const default_currency =
        prev.default_currency === removedCurrency ? prices[0]?.currency || '' : prev.default_currency;
      return { ...prev, prices, default_currency };
    });
  };

  const resetFeatureForm = () => {
    setFeatureForm(emptyFeatureForm);
    setEditingFeatureId(null);
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();

    const validRows = featureForm.prices.filter((p) => p.currency && p.amount !== '');
    if (!featureForm.feature_name.trim()) {
      showToast('Feature name is required.', 'error');
      return;
    }
    if (validRows.length === 0) {
      showToast('At least one currency price is required.', 'error');
      return;
    }

    const pricesPayload = {};
    for (const row of validRows) {
      pricesPayload[row.currency] = Number(row.amount);
    }

    const payload = {
      feature_name: featureForm.feature_name.trim(),
      duration_days: featureForm.duration_days ? Number(featureForm.duration_days) : null,
      usage_limit: featureForm.usage_limit ? Number(featureForm.usage_limit) : null,
      description: featureForm.description || null,
      default_currency: featureForm.default_currency || validRows[0].currency,
      prices: pricesPayload,
    };

    setSavingFeature(true);
    try {
      if (editingFeatureId) {
        await axiosInstance.put(`/api/feature/price/${editingFeatureId}/edit`, payload);
        showToast('Feature updated successfully.');
      } else {
        await axiosInstance.post('/api/feature/price/create', payload);
        showToast('Feature created successfully.');
      }
      resetFeatureForm();
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save feature.', 'error');
    } finally {
      setSavingFeature(false);
    }
  };

  const handleEditFeature = (item) => {
    const priceRows = Object.entries(item.prices || {}).map(([currency, amount]) => ({
      currency,
      amount: String(amount),
    }));
    setFeatureForm({
      feature_name: item.feature_name,
      duration_days: item.duration_days ?? '',
      usage_limit: item.usage_limit ?? '',
      description: item.description ?? '',
      default_currency: item.default_currency || priceRows[0]?.currency || 'UGX',
      prices: priceRows.length ? priceRows : [{ currency: item.default_currency || 'UGX', amount: '' }],
    });
    setEditingFeatureId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Access form handlers ─────────────────────────────────────────────────

  const handleAccessField = (e) => {
    const { name, value } = e.target;
    setAccessForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetAccessForm = () => {
    setAccessForm(emptyAccessForm);
    setEditingAccessId(null);
  };

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    if (!accessForm.feature_name.trim() || !accessForm.txn_id.trim()) {
      showToast('Feature name and transaction ID are required.', 'error');
      return;
    }
    if (!accessForm.user_id && !accessForm.guest_phone_number) {
      showToast('Provide either a user ID or a guest phone number.', 'error');
      return;
    }

    setSavingAccess(true);
    try {
      if (editingAccessId) {
        await axiosInstance.put(`/api/feature/access/${editingAccessId}/edit`, accessForm);
        showToast('Access record updated.');
      } else {
        await axiosInstance.post('/api/feature/access/create', accessForm);
        showToast('Access record created.');
      }
      resetAccessForm();
      setShowAccessForm(false);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save access record.', 'error');
    } finally {
      setSavingAccess(false);
    }
  };

  const handleEditAccess = (item) => {
    setAccessForm({
      user_id: item.user_id ?? '',
      guest_phone_number: item.guest_phone_number ?? '',
      feature_name: item.feature_name ?? '',
      txn_id: item.txn_id ?? '',
      payment_status: item.payment_status ?? 'pending',
      access_expires_at: item.access_expires_at ? item.access_expires_at.slice(0, 16) : '',
      usage_left: item.usage_left ?? '',
    });
    setEditingAccessId(item.id);
    setShowAccessForm(true);
  };

  // ── Delete flow ───────────────────────────────────────────────────────────

  const askDeleteFeature = (item) =>
    setConfirmDelete({ type: 'feature', id: item.id, label: `the feature "${item.feature_name}"` });

  const askDeleteAccess = (item) =>
    setConfirmDelete({ type: 'access', id: item.id, label: `the access record "${item.txn_id}"` });

  const confirmDeletion = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.type === 'feature') {
        await axiosInstance.delete(`/api/feature/price/${confirmDelete.id}/delete`);
        showToast('Feature deleted.');
      } else {
        await axiosInstance.delete(`/api/feature/access/${confirmDelete.id}/delete`);
        showToast('Access record deleted.');
      }
      loadAll();
    } catch (err) {
      showToast('Deletion failed.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  // ── Access filtering ─────────────────────────────────────────────────────

  const filteredAccess = useMemo(() => {
    return accessRecords.filter((a) => {
      const matchesStatus = accessStatusFilter === 'all' || a.payment_status === accessStatusFilter;
      const search = accessSearch.trim().toLowerCase();
      const matchesSearch =
        !search ||
        a.feature_name?.toLowerCase().includes(search) ||
        a.txn_id?.toLowerCase().includes(search) ||
        a.guest_phone_number?.toLowerCase().includes(search) ||
        String(a.user_id ?? '').includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [accessRecords, accessSearch, accessStatusFilter]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Toast toast={toast} />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm deletion"
        message={confirmDelete ? `Are you sure you want to delete ${confirmDelete.label}? This action cannot be undone.` : ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeletion}
        loading={deleting}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Feature Manager</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage paid feature pricing (multi-currency) and granted access.
        </p>
      </div>

      {/* ── Feature Price Form ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingFeatureId ? 'Edit feature' : 'New feature'}
        </h2>

        <form onSubmit={handleFeatureSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLASSES}>Feature name *</label>
              <input
                type="text"
                name="feature_name"
                value={featureForm.feature_name}
                onChange={handleFeatureField}
                placeholder="reporteudrguest"
                className={INPUT_CLASSES}
                required
              />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Duration (days)</label>
              <input
                type="number"
                name="duration_days"
                value={featureForm.duration_days}
                onChange={handleFeatureField}
                placeholder="30"
                className={INPUT_CLASSES}
              />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Usage limit</label>
              <input
                type="number"
                name="usage_limit"
                value={featureForm.usage_limit}
                onChange={handleFeatureField}
                placeholder="5"
                className={INPUT_CLASSES}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASSES}>Description</label>
            <input
              type="text"
              name="description"
              value={featureForm.description}
              onChange={handleFeatureField}
              placeholder="Optional"
              className={INPUT_CLASSES}
            />
          </div>

          {/* Prices by currency */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${LABEL_CLASSES} mb-0`}>Prices by currency *</label>
              <button
                type="button"
                onClick={addPriceRow}
                disabled={featureForm.prices.length >= CURRENCIES.length}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                + Add currency
              </button>
            </div>

            <div className="space-y-2">
              {featureForm.prices.map((row, index) => {
                // Exclut les devises déjà choisies sur les AUTRES lignes,
                // pour empêcher un doublon silencieux dans le payload final.
                const usedByOthers = new Set(
                  featureForm.prices.filter((_, i) => i !== index).map((p) => p.currency)
                );
                const availableCurrencies = CURRENCIES.filter(
                  (c) => c === row.currency || !usedByOthers.has(c)
                );

                return (
                  <div key={index} className="flex items-center gap-2">
                    {/* Largeur fixe isolée sur ce wrapper, jamais sur le select
                        lui-même : évite le conflit w-full / w-28 sur le même
                        élément qui faisait déborder le select sur toute la ligne. */}
                    <div className="w-28 shrink-0">
                      <select
                        value={row.currency}
                        onChange={(e) => handlePriceRowChange(index, 'currency', e.target.value)}
                        className={INPUT_CLASSES}
                      >
                        {availableCurrencies.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Même principe : flex-1 isolé sur ce wrapper, l'input
                        garde juste w-full. Corrige le champ Amount quasi invisible. */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => handlePriceRowChange(index, 'amount', e.target.value)}
                        placeholder="Amount"
                        className={INPUT_CLASSES}
                      />
                    </div>

                    <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap shrink-0">
                      <input
                        type="radio"
                        name="default_currency_radio"
                        checked={featureForm.default_currency === row.currency}
                        onChange={() =>
                          setFeatureForm((prev) => ({ ...prev, default_currency: row.currency }))
                        }
                      />
                      Default
                    </label>
                    <button
                      type="button"
                      onClick={() => removePriceRow(index)}
                      disabled={featureForm.prices.length <= 1}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-300 text-sm px-2 shrink-0"
                      title="Remove this currency"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={savingFeature}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {savingFeature
                ? 'Saving...'
                : editingFeatureId
                ? 'Update feature'
                : 'Create feature'}
            </button>
            {editingFeatureId && (
              <button
                type="button"
                onClick={resetFeatureForm}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Feature Prices Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Features ({featurePrices.length})</h2>
        </div>

        {loadingLists ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : featurePrices.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No feature configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Feature</th>
                  <th className="text-left px-4 py-3">Prices</th>
                  <th className="text-left px-4 py-3">Default</th>
                  <th className="text-left px-4 py-3">Duration</th>
                  <th className="text-left px-4 py-3">Usage limit</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {featurePrices.map((item) => {
                  const priceEntries = Object.entries(item.prices || {});
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{item.feature_name}</td>
                      <td className="px-4 py-3">
                        {priceEntries.length === 0 ? (
                          <span className="text-xs italic text-red-500">
                            No price set — click Edit to add one
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {priceEntries.map(([cur, amt]) => (
                              <span
                                key={cur}
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  cur === item.default_currency
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {amt} {cur}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.default_currency || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.duration_days ? `${item.duration_days} days` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.usage_limit ?? '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEditFeature(item)}
                          className="text-yellow-600 hover:text-yellow-800 text-xs font-medium mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => askDeleteFeature(item)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Access Records ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Granted access ({filteredAccess.length}/{accessRecords.length})
          </h2>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Search (feature, txn, phone...)"
              value={accessSearch}
              onChange={(e) => setAccessSearch(e.target.value)}
              className={`${INPUT_CLASSES} w-64`}
            />
            <select
              value={accessStatusFilter}
              onChange={(e) => setAccessStatusFilter(e.target.value)}
              className={INPUT_CLASSES}
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={() => {
                resetAccessForm();
                setShowAccessForm((v) => !v);
              }}
              className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              {showAccessForm ? 'Close' : '+ New access'}
            </button>
          </div>
        </div>

        {showAccessForm && (
          <form onSubmit={handleAccessSubmit} className="p-6 border-b bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="user_id"
                value={accessForm.user_id}
                onChange={handleAccessField}
                placeholder="User ID (leave blank for guest)"
                className={INPUT_CLASSES}
              />
              <input
                type="text"
                name="guest_phone_number"
                value={accessForm.guest_phone_number}
                onChange={handleAccessField}
                placeholder="Guest phone number (if no user_id)"
                className={INPUT_CLASSES}
              />
              <select
                name="feature_name"
                value={accessForm.feature_name}
                onChange={handleAccessField}
                className={INPUT_CLASSES}
                required
              >
                <option value="">Select a feature...</option>
                {featurePrices.map((f) => (
                  <option key={f.id} value={f.feature_name}>{f.feature_name}</option>
                ))}
              </select>
              <input
                type="text"
                name="txn_id"
                value={accessForm.txn_id}
                onChange={handleAccessField}
                placeholder="Transaction ID"
                className={INPUT_CLASSES}
                required
              />
              <select
                name="payment_status"
                value={accessForm.payment_status}
                onChange={handleAccessField}
                className={INPUT_CLASSES}
              >
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
              <input
                type="datetime-local"
                name="access_expires_at"
                value={accessForm.access_expires_at}
                onChange={handleAccessField}
                className={INPUT_CLASSES}
              />
              <input
                type="number"
                name="usage_left"
                value={accessForm.usage_left}
                onChange={handleAccessField}
                placeholder="Usage left (blank = unlimited)"
                className={INPUT_CLASSES}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingAccess}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400"
              >
                {savingAccess ? 'Saving...' : editingAccessId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAccessForm();
                  setShowAccessForm(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loadingLists ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : filteredAccess.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No access record matches these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Feature</th>
                  <th className="text-left px-4 py-3">Holder</th>
                  <th className="text-left px-4 py-3">Txn</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Expires</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAccess.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.feature_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.user_id ? `User #${item.user_id}` : item.guest_phone_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.txn_id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[item.payment_status] || STATUS_STYLES.unknown
                        }`}
                      >
                        {item.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.amount != null ? `${item.amount} ${item.currency || ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.access_expires_at
                        ? new Date(item.access_expires_at).toLocaleDateString()
                        : 'Unlimited'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEditAccess(item)}
                        className="text-yellow-600 hover:text-yellow-800 text-xs font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => askDeleteAccess(item)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureManager;