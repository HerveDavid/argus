const Terminal = () => {
  return (
    <div className="bg-background text-green-400 font-mono text-sm p-3 rounded h-full overflow-auto">
      <div>$ npm start</div>
      <div className="text-gray-400">Starting development server...</div>
      <div className="text-green-400">
        ✓ Server running on http://localhost:3000
      </div>
      <div className="mt-2">
        $ <span className="animate-pulse">|</span>
      </div>
    </div>
  );
};

export default Terminal;
