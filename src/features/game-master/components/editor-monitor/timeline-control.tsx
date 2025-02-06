import { useState } from 'react';
import { 
    Play, 
    Pause,
    Square,
    SkipBack,
    SkipForward,
    ZoomIn,
    ZoomOut,
    LucideIcon
} from 'lucide-react';

// Types pour les props des composants
interface ControlButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    label: string;
}

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onStop: () => void;
    onSkipBack: () => void;
    onSkipForward: () => void;
}

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    zoomLevel: number;
}

// Composant pour un bouton de contrôle
const ControlButton: React.FC<ControlButtonProps> = ({ onClick, icon: Icon, label }) => (
    <button 
        onClick={onClick}
        className="hover:text-white transition-colors"
        aria-label={label}
        type="button"
    >
        <Icon className="w-4 h-4" />
    </button>
);

// Composant pour les contrôles de lecture
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    isPlaying,
    onPlayPause,
    onStop,
    onSkipBack,
    onSkipForward
}) => (
    <div className="flex items-center space-x-2">
        <ControlButton 
            onClick={onPlayPause}
            icon={isPlaying ? Pause : Play}
            label={isPlaying ? 'Pause' : 'Play'}
        />
        <ControlButton 
            onClick={onStop}
            icon={Square}
            label="Stop"
        />
        <ControlButton 
            onClick={onSkipBack}
            icon={SkipBack}
            label="Skip backward"
        />
        <ControlButton 
            onClick={onSkipForward}
            icon={SkipForward}
            label="Skip forward"
        />
    </div>
);

// Composant pour les contrôles de zoom
const ZoomControls: React.FC<ZoomControlsProps> = ({
    onZoomIn,
    onZoomOut,
    zoomLevel
}) => (
    <div className="flex items-center space-x-2">
        <ControlButton 
            onClick={onZoomIn}
            icon={ZoomIn}
            label="Zoom in"
        />
        <ControlButton 
            onClick={onZoomOut}
            icon={ZoomOut}
            label="Zoom out"
        />
        <span className="text-sm">
            {(zoomLevel * 100).toFixed(0)}%
        </span>
    </div>
);

// Types pour le composant principal
type TimeFormat = `${string}:${string}:${string}:${string}`;

// Constantes
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;
const INITIAL_TIME: TimeFormat = '00:02:21:03';

export const TimelineControl: React.FC = () => {
    // États avec types
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<TimeFormat>(INITIAL_TIME);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    
    // Gestionnaires d'événements
    const handlePlayPause = (): void => {
        setIsPlaying(prev => !prev);
    };
    
    const handleStop = (): void => {
        setIsPlaying(false);
        setCurrentTime('00:00:00:00');
    };
    
    const handleSkipBack = (): void => {
        console.log('Skip back');
    };
    
    const handleSkipForward = (): void => {
        console.log('Skip forward');
    };
    
    const handleZoomIn = (): void => {
        setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    };
    
    const handleZoomOut = (): void => {
        setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    };
    
    return (
        <div className="h-8 bg-gray-800 flex items-center px-2 space-x-2 text-gray-300">
            <PlaybackControls 
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onStop={handleStop}
                onSkipBack={handleSkipBack}
                onSkipForward={handleSkipForward}
            />
            
            <span className="text-sm">{currentTime}</span>
            
            <div className="flex-1" />
            
            <ZoomControls 
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                zoomLevel={zoomLevel}
            />
        </div>
    );
};

export default TimelineControl;