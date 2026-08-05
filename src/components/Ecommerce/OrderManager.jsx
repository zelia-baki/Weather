import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  X, Search, Loader2, AlertTriangle, ClipboardList, Truck, CheckCircle2,
  XCircle, Undo2, MapPin, User as UserIcon, Image as ImageIcon,
} from 'lucide-react';

// ── Order status meta ────────────────────────────────────────────────────────
// Mirrors ORDER_STATUS_TRANSITIONS from ecommerce.py — keeps the action
// buttons in sync with what the backend will actually allow.
const ORDER_STATUS_TRANSITIONS = {
  paid:      ['shipped', 'cancelled', 'refunded'],
  shipped:   ['delivered', 'cancelled', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded:  [],
};

const ORDER_STATUS_META = {
  pending:        { label: 'Pending payment', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  paid:           { label: 'Paid',            color: 'bg-blue-50 text-blue-700 border-blue-200' },
  shipped:        { label: 'Shipped',         color: 'bg-amber-50 text-amber-700 border-amber-200' },
  delivered:      { label: 'Delivered',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:      { label: 'Cancelled',       color: 'bg-red-50 text-red-700 border-red-200' },
  refunded:       { label: 'Refunded',        color: 'bg-purple-50 text-purple-700 border-purple-200' },
  payment_failed: { label: 'Payment failed',  color: 'bg-red-50 text-red-700 border-red-200' },
};

const STATUS_ACTION_META = {
  shipped:   { label: 'Mark as shipped',   icon: <Truck size={13}/>,        cls: 'bg-amber-600 hover:bg-amber-700' },
  delivered: { label: 'Mark as delivered', icon: <CheckCircle2 size={13}/>, cls: 'bg-emerald-600 hover:bg-emerald-700' },
  cancelled: { label: 'Cancel order',      icon: <XCircle size={13}/>,      cls: 'bg-red-600 hover:bg-red-700' },
  refunded:  { label: 'Refund order',      icon: <Undo2 size={13}/>,        cls: 'bg-purple-600 hover:bg-purple-700' },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const OrderStatusBadge = ({ status }) => {
  const meta = ORDER_STATUS_META[status] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
      {meta.label}
    </span>
  );
};

// ── Order detail drawer ──────────────────────────────────────────────────────
const OrderDetailDrawer = ({ order, open, onClose, onStatusChanged }) => {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const availableActions = ORDER_STATUS_TRANSITIONS[order.status] || [];

  const handleStatusChange = async (newStatus) => {
    const actionMeta = STATUS_ACTION_META[newStatus];
    const isDestructive = newStatus === 'cancelled' || newStatus === 'refunded';

    const confirm = await Swal.fire({
      title: `${actionMeta.label}?`,
      text: isDestructive
        ? 'This will restore the stock for every item in this order.'
        : `Order #${order.id} will be marked as ${newStatus}.`,
      icon: isDestructive ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: isDestructive ? '#dc2626' : '#16a34a',
      confirmButtonText: actionMeta.label,
      customClass: { popup: 'rounded-2xl' },
    });
    if (!confirm.isConfirmed) return;

    setUpdating(true);
    try {
      const res = await axiosInstance.put(`/api/ecommerce/orders/${order.id}/status`, { status: newStatus });
      onStatusChanged(res.data.order);
      Swal.fire({
        icon: 'success', title: 'Order updated', timer: 1500, showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Could not update order',
        text: err.response?.data?.msg || err.message,
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList size={18} className="text-gray-500"/> Order #{order.id}
            </h2>
            <div className="mt-1"><OrderStatusBadge status={order.status}/></div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Customer info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserIcon size={12}/> Customer
            </p>
            <div className="bg-gray-50 rounded-xl p-3.5 text-sm text-gray-700 space-y-1">
              <p className="font-semibold">{order.customer_name || 'Unknown'}</p>
              {order.customer_email && <p className="text-gray-500">{order.customer_email}</p>}
              {order.guest_phone && <p className="text-gray-500">{order.guest_phone}</p>}
            </div>
          </div>

          {/* Shipping address */}
          {order.shipping_address && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin size={12}/> Shipping address
              </p>
              <p className="bg-gray-50 rounded-xl p-3.5 text-sm text-gray-700">{order.shipping_address}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Items ({order.item_count})
            </p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {order.items.map((item, i) => (
                <div key={item.id} className={`flex gap-3 p-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="w-11 h-11 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {item.product_image
                      ? <img src={item.product_image} alt="" className="w-full h-full object-cover"/>
                      : <ImageIcon size={14} className="text-gray-300"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} × {item.unit_price.toLocaleString()} {order.currency}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    {item.line_total.toLocaleString()} {order.currency}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-gray-50 border-t border-gray-100">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-base font-bold text-gray-800">{order.total_amount.toLocaleString()} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Placed: {formatDate(order.date_created)}</p>
            {order.date_updated && <p>Last updated: {formatDate(order.date_updated)}</p>}
            {order.dpo_trans_ref && <p>Payment ref: {order.dpo_trans_ref}</p>}
          </div>
        </div>

        {/* Actions */}
        {availableActions.length > 0 && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white space-y-2">
            {availableActions.map(status => {
              const meta = STATUS_ACTION_META[status];
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updating}
                  className={`w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-colors ${meta.cls} ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? <Loader2 size={14} className="animate-spin"/> : meta.icon}
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

// =============================================================================
// OrderManager — fully self-contained: fetches its own data, owns its own
// search/filter state, and renders its own detail drawer. Drop it into any
// tab/page with <OrderManager /> — no props required.
// =============================================================================
const OrderManager = () => {
  const [orders,         setOrders]         = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [search,         setSearch]         = useState('');
  const [selectedOrder,  setSelectedOrder]  = useState(null);

  const fetchOrders = useCallback(async (filter) => {
    setLoading(true);
    setError('');
    try {
      const params = filter && filter !== 'all' ? { status: filter } : {};
      const r = await axiosInstance.get('/api/ecommerce/orders/admin', { params });
      setOrders(r.data ?? []);
    } catch {
      setError('Error fetching orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(statusFilter); }, [fetchOrders, statusFilter]);

  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return String(o.id).includes(q) || o.customer_name?.toLowerCase().includes(q);
  });

  const handleStatusChanged = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></span>
        <input
          type="text"
          placeholder="Search by order # or customer name…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            {s === 'all' ? 'All' : (ORDER_STATUS_META[s]?.label || s)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={15}/></button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={20} className="animate-spin"/>
          </div>
        )}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <ClipboardList size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        )}
        {!loading && filteredOrders.map(order => (
          <button
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold flex-shrink-0">
                  #{order.id}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                    {order.customer_name || 'Unknown customer'}
                    <OrderStatusBadge status={order.status}/>
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="text-xs text-gray-500">{order.item_count} item{order.item_count > 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-500">{formatDate(order.date_created)}</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-800 flex-shrink-0">
                {order.total_amount.toLocaleString()} {order.currency}
              </span>
            </div>
          </button>
        ))}
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
};

export default OrderManager;