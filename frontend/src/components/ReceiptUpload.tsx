import { useRef, useState } from 'react';

interface Props {
  image: string | null;
  onChange: (base64: string | null) => void;
}

// Compress image to max 800px and ~80% quality JPEG
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = (h / w) * MAX; w = MAX; }
          else { w = (w / h) * MAX; h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReceiptUpload({ image, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch (err) {
      console.error('Image compression error:', err);
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="receipt-upload">
      {image ? (
        <div className="receipt-preview-container">
          <img
            src={image}
            alt="Receipt"
            className="receipt-thumb"
            onClick={() => setPreview(true)}
          />
          <div className="receipt-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => inputRef.current?.click()}
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              🔄 Change
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onChange(null)}
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              ✕ Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="receipt-upload-btn"
          onClick={() => inputRef.current?.click()}
        >
          <span className="receipt-upload-icon">📷</span>
          <span>Add Receipt 新增收據</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {/* Full-size preview modal */}
      {preview && image && (
        <div className="modal-overlay" onClick={() => setPreview(false)}>
          <div className="receipt-full-preview" onClick={e => e.stopPropagation()}>
            <img src={image} alt="Receipt full" />
            <button
              className="btn btn-secondary"
              onClick={() => setPreview(false)}
              style={{ marginTop: '12px' }}
            >
              ✕ Close 關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
