import React, { useState } from 'react';
import CopyTextTool from './CopyTextTool';
export default function ToolsSidebar({ open, onClose }) {
  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-bold">Tools</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
      </div>
      <div className="p-4">
        <CopyTextTool />
      </div>
    </div>
  );
}
