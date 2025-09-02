import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

export default function CopyTextTool() {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [loading, setLoading] = useState(false);
  const [rect, setRect] = useState(null);
  const imgRef = useRef();
  const canvasRef = useRef();

  // Handle image upload
  const handleImage = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Draw rectangle on canvas
  const handleCanvasMouseDown = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setRect({ startX, startY, endX: startX, endY: startY });
  };
  const handleCanvasMouseMove = e => {
    if (!rect) return;
    const bounding = canvasRef.current.getBoundingClientRect();
    setRect({ ...rect, endX: e.clientX - bounding.left, endY: e.clientY - bounding.top });
  };
  const handleCanvasMouseUp = () => {};

  // Run OCR on selected area
  const runOcr = async () => {
    if (!image || !rect) return;
    setLoading(true);
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const x = Math.min(rect.startX, rect.endX);
    const y = Math.min(rect.startY, rect.endY);
    const w = Math.abs(rect.endX - rect.startX);
    const h = Math.abs(rect.endY - rect.startY);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
    const dataUrl = canvas.toDataURL();
    const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng');
    setOcrText(text);
    setLoading(false);
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Copy Text from Screenshot</h3>
      <input type="file" accept="image/*" onChange={handleImage} className="mb-2" />
      {image && (
        <div className="relative mb-2">
          <img ref={imgRef} src={image} alt="Screenshot" className="max-w-full rounded shadow" />
          <canvas
            ref={canvasRef}
            width={imgRef.current?.width || 400}
            height={imgRef.current?.height || 300}
            className="absolute top-0 left-0 w-full h-full"
            style={{ pointerEvents: 'auto' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />
        </div>
      )}
      {image && rect && !ocrText && (
        <button onClick={runOcr} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">Extract Text</button>
      )}
      {loading && <div className="mt-2 text-gray-500">Extracting text...</div>}
      {ocrText && (
        <div className="mt-2">
          <textarea className="w-full p-2 border rounded" value={ocrText} readOnly rows={4} />
          <button className="mt-2 px-4 py-2 bg-green-500 text-white rounded" onClick={() => navigator.clipboard.writeText(ocrText)}>Copy Text</button>
        </div>
      )}
    </div>
  );
}
