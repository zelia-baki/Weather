// components/LoadingOverlay.js
const LoadingOverlay = ({ visible, message = 'Chargement...' }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow text-center">
        <div className="loader mb-4" /> {/* Ajoute une animation CSS */}
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
