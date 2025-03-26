const StatusBar = () => {
  return (
    <div className="h-6 bg-gray-300 border-t border-gray-400 flex items-center px-2 text-xs">
      <div className="flex-grow truncate">Insert Mark 1.1.1 (Time: 0:00)</div>
      <div className="ml-2 hidden sm:block">4-Audio</div>
    </div>
  );
};

export default StatusBar;
