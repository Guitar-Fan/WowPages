import React from 'react';
export default function BrowserChrome({ onTools }) {
  return (
    <div className="shadow-lg rounded-lg bg-white mx-auto mt-8 max-w-4xl border border-gray-300">
      {/* Chrome-like top bar */}
      <div className="flex items-center px-4 py-2 bg-gray-200 rounded-t-lg">
        <div className="flex space-x-2 mr-4">
          <span className="w-3 h-3 bg-red-400 rounded-full inline-block"></span>
          <span className="w-3 h-3 bg-yellow-400 rounded-full inline-block"></span>
          <span className="w-3 h-3 bg-green-400 rounded-full inline-block"></span>
        </div>
        <div className="flex-1">
          <input className="w-full px-3 py-1 rounded bg-white border border-gray-300" placeholder="Search Google or type a URL" />
        </div>
        <button className="ml-4 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={onTools}>Tools</button>
      </div>
      {/* Content area */}
      <div className="p-8 min-h-[400px]">Browser content here</div>
    </div>
  );
}
