import { useRef, useState, useCallback } from 'react';
import { Check, X, Loader2, Pen } from 'lucide-react';

export function DigitalSignature({ onSign, onCancel, loading = false, title = 'Sign Contract' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    if (!hasSignature) return;

    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onSign?.(signatureData);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-primary-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pen className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-primary-900">{title}</h3>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="p-4">
        <div className="relative border-2 border-dashed border-primary-200 rounded-xl bg-primary-50 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="w-full touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-primary-400 text-sm">Sign here</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={clear}
            disabled={!hasSignature || loading}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={handleSign}
            disabled={!hasSignature || loading}
            className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Sign Contract
              </>
            )}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
        <p className="text-xs text-primary-600 text-center">
          By signing, you agree to the terms and conditions of this contract.
          Your signature is legally binding.
        </p>
      </div>
    </div>
  );
}

// Compact signature pad for inline use
export function SignaturePad({ onSign, disabled = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (disabled || !isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onSign?.(signatureData);
  };

  return (
    <div className="space-y-3">
      <div className="relative border border-primary-200 rounded-lg bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={300}
          height={100}
          className="w-full touch-none cursor-crosshair"
          style={{ opacity: disabled ? 0.5 : 1 }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-primary-300 text-sm">Sign here</p>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={!hasSignature || disabled}
          className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasSignature || disabled}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

export default DigitalSignature;
