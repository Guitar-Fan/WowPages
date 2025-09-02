import React, { useState } from 'react';
import ToolsSidebar from './ToolsSidebar';
import BrowserChrome from './BrowserChrome';
import './index.css';

export default function App() {
  const [toolsOpen, setToolsOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-100">
      <BrowserChrome onTools={() => setToolsOpen(!toolsOpen)} />
      <ToolsSidebar open={toolsOpen} onClose={() => setToolsOpen(false)} />
    </div>
  );
}
