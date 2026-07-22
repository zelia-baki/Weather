import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import { useCart } from '../../context/CartContext';
import VerifiedStamp from './VerifiedStamp';
import Swal from 'sweetalert2';

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/api/ecommerce/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    addItem(product, quantity);
    Swal.fire({
      icon: 'success', title: 'Added to cart', timer: 1500, showConfirmButton: false,
      customClass: { popup: 'rounded-2xl' },
    });
  };

  if (loading) return <div style={{ background: '#f7f4ee', minHeight: '100vh' }} />;
  if (!product) return (
    <div style={{ background: '#f7f4ee', minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#14231a' }}>
      Product not found.
    </div>
  );

  return (
    <div style={{ background: '#f7f4ee', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{
        maxWidth: 1040, margin: '0 auto', display: 'grid',
        gridTemplateColumns: '1fr 1fr', gap: 56,
      }}>
        <div>
          <div style={{
            aspectRatio: '1', background: '#eee9de', borderRadius: 12,
            overflow: 'hidden', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'rgba(20,35,26,0.3)', fontFamily: "'Epilogue', sans-serif" }}>
                No image
              </span>
            )}
            {product.is_deforestation_free && (
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <VerifiedStamp />
              </div>
            )}
          </div>

          {/* ── Origin story ─────────────────────────────────────────── */}
          {product.origin_story && (
            <div style={{
              marginTop: 24, padding: '24px 26px', background: '#eee9de',
              borderRadius: 12, borderLeft: '3px solid #16803c',
            }}>
              <div style={{
                fontFamily: "'Epilogue', sans-serif", fontSize: 11, letterSpacing: 2,
                color: '#16803c', textTransform: 'uppercase', marginBottom: 10,
              }}>
                The story of this lot
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: 18, lineHeight: 1.65,
                color: '#14231a', fontStyle: 'italic', marginBottom: (product.farmer_name || product.harvest_year) ? 14 : 0,
              }}>
                {product.origin_story}
              </p>
              {(product.farmer_name || product.harvest_year) && (
                <div style={{
                  fontFamily: "'Epilogue', sans-serif", fontSize: 12,
                  color: 'rgba(20,35,26,0.5)', letterSpacing: 0.3,
                }}>
                  {product.farmer_name && <span>Grown by {product.farmer_name}</span>}
                  {product.farmer_name && product.harvest_year && <span> · </span>}
                  {product.harvest_year && <span>{product.harvest_year} harvest</span>}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div style={{
            fontFamily: "'Epilogue', sans-serif", fontSize: 12, letterSpacing: 2,
            color: '#a9784f', textTransform: 'uppercase', marginBottom: 12,
          }}>
            {product.origin_country || product.category}
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 42,
            color: '#14231a', fontWeight: 500, marginBottom: 16,
          }}>
            {product.name}
          </h1>
          <p style={{
            fontFamily: "'Epilogue', sans-serif", fontSize: 15, lineHeight: 1.7,
            color: 'rgba(20,35,26,0.65)', marginBottom: 24,
          }}>
            {product.description || 'No description available for this lot yet.'}
          </p>

          {product.certification_labels?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {product.certification_labels.map(label => (
                <span key={label} style={{
                  fontFamily: "'Epilogue', sans-serif", fontSize: 11,
                  padding: '5px 12px', borderRadius: 100,
                  border: '1px solid rgba(22,128,60,0.3)', color: '#16803c',
                }}>
                  {label}
                </span>
              ))}
            </div>
          )}

          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 28,
            color: '#14231a', marginBottom: 32,
          }}>
            {product.price.toLocaleString()} {product.currency}
            <span style={{ fontSize: 14, color: 'rgba(20,35,26,0.45)' }}> / {product.unit}</span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', border: '1px solid rgba(20,35,26,0.15)',
              borderRadius: 100, overflow: 'hidden',
            }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#14231a', cursor: 'pointer' }}>
                −
              </button>
              <span style={{ padding: '0 16px', color: '#14231a', fontFamily: "'Epilogue', sans-serif" }}>
                {quantity}
              </span>
              <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#14231a', cursor: 'pointer' }}>
                +
              </button>
            </div>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 12, color: 'rgba(20,35,26,0.45)' }}>
              {product.stock} available
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            style={{
              width: '100%', padding: '16px', borderRadius: 100, border: 'none',
              background: product.stock === 0 ? 'rgba(20,35,26,0.08)' : '#16803c',
              color: product.stock === 0 ? 'rgba(20,35,26,0.35)' : '#f7f4ee',
              fontFamily: "'Epilogue', sans-serif", fontWeight: 700, fontSize: 15,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              marginBottom: 14,
            }}
          >
            {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>

          <Link to="/shop/checkout" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            fontFamily: "'Epilogue', sans-serif", fontSize: 13,
            color: 'rgba(20,35,26,0.5)',
          }}>
            View cart & checkout →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;