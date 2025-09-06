// Simple test app to debug the error
import React from 'react';
import { Debug } from './debug';


const SimpleApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Debug Mode</h1>
      <Debug />
      
      <div className="mt-8 p-4 bg-blue-100 rounded">
        <h2 className="font-bold">Environment Check:</h2>
        <p>If you see "MISSING!" above, that's the problem.</p>
        <p>Check your .env file has the correct VITE_ prefixed variables.</p>
      </div>
    </div>
  );
};

export default SimpleApp;