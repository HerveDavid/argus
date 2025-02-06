import { 
    Volume2,
    Eye,
    Lock} from 'lucide-react';
    
export const TimelinePanel = () => {
    return (
        <div className="flex">
        {/* Track Labels */}
        <div className="w-48 pr-2">
          {[1, 2, 3, 4].map(track => (
            <div key={track} className="h-12 flex items-center space-x-2 border-b border-gray-700">
              <Eye className="w-4 h-4" />
              <Lock className="w-4 h-4" />
              <span className="text-sm">Video {track}</span>
            </div>
          ))}
          {[1, 2].map(track => (
            <div key={track} className="h-12 flex items-center space-x-2 border-b border-gray-700">
              <Volume2 className="w-4 h-4" />
              <Lock className="w-4 h-4" />
              <span className="text-sm">Audio {track}</span>
            </div>
          ))}
        </div>

        {/* Timeline Content */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            {[1, 2, 3, 4, 5, 6].map(track => (
              <div key={track} className="h-12 border-b border-gray-700">
                {track === 1 && (
                  <div className="h-full ml-4 w-32 bg-blue-500 opacity-50 rounded"></div>
                )}
                {track === 2 && (
                  <div className="h-full ml-24 w-48 bg-blue-500 opacity-50 rounded"></div>
                )}
              </div>
            ))}
            {/* Playhead */}
            <div className="absolute top-0 bottom-0 w-px bg-red-500 left-1/3"></div>
          </div>
        </div>
        </div>
    );
}