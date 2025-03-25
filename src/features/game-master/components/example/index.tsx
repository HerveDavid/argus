import { Timeline, TimelineOptions, TimelineTimeAxisScaleType } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { useEffect, useRef, useState } from 'react';

// In your component:
const SimulationEditor = () => {
  const containerRef = useRef(null);
  const timelineRef = useRef<Timeline | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Function to handle window resize
    const handleResize = () => {
      if (timelineRef.current) {
        timelineRef.current.redraw();
      }
    };
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Create items dynamically like in the example
    const items = [];
    for (let i = 10; i >= 0; i--) {
      items.push({
        id: i,
        content: "item " + i,
        start: new Date(new Date().getTime() + i * 100000)
      });
    }
    
    // Create the timeline with explicit format options
    const options: TimelineOptions = {
      // Set the start and end time similar to example
      start: new Date(),
      end: new Date(new Date().getTime() + 1000000),
      // Add rolling mode options for animation
      rollingMode: {
        follow: true,
        offset: 0.5
      },
      timeAxis: {
        scale: 'minute' as TimelineTimeAxisScaleType, 
        step: 1
      },
      format: {
        minorLabels: {
          minute: 'h:mma',
          hour: 'ha',
          day: 'D',
          week: 'D MMM',
          month: 'MMM',
          year: 'YYYY'
        },
        majorLabels: {
          minute: 'ddd D MMMM',
          hour: 'ddd D MMMM',
          day: 'MMMM YYYY',
          week: 'MMMM YYYY',
          month: 'YYYY',
          year: ''
        }
      }
    };
    
    // Initialize the timeline without groups
    try {
      const timeline = new Timeline(
        containerRef.current,
        items,
        options
      );
      
      // Store timeline reference for control functions
      timelineRef.current = timeline;
      
      // Return cleanup function
      return () => {
        // Remove resize event listener
        window.removeEventListener('resize', handleResize);
        
        if (timeline) {
          timeline.destroy();
        }
      };
    } catch (error) {
      console.error('Timeline initialization error:', error);
    }
  }, []);
  
  // Control functions for the timeline
  const startTimeline = () => {
    if (timelineRef.current) {
      timelineRef.current.setOptions({ 
        rollingMode: { follow: true, offset: 0.5 }
      });
      setIsPlaying(true);
    }
  };
  
  const pauseTimeline = () => {
    if (timelineRef.current) {
      timelineRef.current.setOptions({ 
        rollingMode: { follow: false }
      });
      setIsPlaying(false);
    }
  };
  
  const restartTimeline = () => {
    if (timelineRef.current) {
      // Reset the view to current time
      timelineRef.current.moveTo(new Date());
      
      // If paused, keep it paused, otherwise ensure it's playing
      if (!isPlaying) {
        timelineRef.current.setOptions({ 
          rollingMode: { follow: false }
        });
      } else {
        timelineRef.current.setOptions({ 
          rollingMode: { follow: true, offset: 0.5 }
        });
      }
    }
  };
  
  return (
    <div className="timeline-container" style={{ width: '100%', maxWidth: '100vw', overflow: 'hidden', padding: '0 16px', boxSizing: 'border-box' }}>
      <h1 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
        <span style={{ fontStyle: 'italic', marginRight: '10px' }}>⚼</span>
        Timeline rolling mode option
      </h1>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: 'clamp(300px, 60vh, 600px)', 
          margin: '0 auto', 
          overflow: 'hidden',
          boxSizing: 'border-box'
        }} 
      />
      <div style={{ 
        marginTop: '10px', 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        gap: 'clamp(8px, 2vw, 16px)', 
        justifyContent: 'center',
        padding: '10px 0'
      }}>
        {isPlaying ? (
          <button 
            onClick={pauseTimeline} 
            style={{ 
              padding: 'clamp(6px, 2vw, 12px) clamp(12px, 3vw, 24px)', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              minWidth: 'clamp(80px, 20vw, 120px)'
            }}
          >
            Pause
          </button>
        ) : (
          <button 
            onClick={startTimeline} 
            style={{ 
              padding: 'clamp(6px, 2vw, 12px) clamp(12px, 3vw, 24px)', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              minWidth: 'clamp(80px, 20vw, 120px)'
            }}
          >
            Start
          </button>
        )}
        <button 
          onClick={restartTimeline}
          style={{ 
            padding: 'clamp(6px, 2vw, 12px) clamp(12px, 3vw, 24px)', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            minWidth: 'clamp(80px, 20vw, 120px)'
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default SimulationEditor;