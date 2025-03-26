const DisplayBar = () => {
  return (
    <div className="h-24 bg-gray-200 border-t border-gray-400 flex flex-col md:flex-row">
      <div className="md:w-1/4 border-r border-gray-400 p-2">
        <div className="text-xs font-semibold">Track Display</div>
        <div className="text-xs text-gray-600 mt-1 hidden sm:block">
          Drag and drop to select time, then use any available Edit menu command
          to edit.
        </div>
        <div className="text-xs text-gray-600 mt-1 hidden md:block">
          <div>[Ctrl+Alt+Drag] Sound Display</div>
          <div>[Ctrl+] Sound Warp Zoom In/Out</div>
          <div>[Alt+Scroll Wheel] Adjust Track Height</div>
        </div>
      </div>
      <div className="flex-grow flex items-center justify-center text-xs text-gray-600">
        Drag Audio Effects Here
      </div>
      <div className="md:w-1/4 bg-gray-300 flex items-center justify-center relative">
        {/* Webcam placeholder */}
        <div className="bg-gray-700 w-full h-full">
          <div className="absolute bottom-0 right-0 p-1 bg-red-500 text-white text-xs">
            @Sadowick
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayBar;
