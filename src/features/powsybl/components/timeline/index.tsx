import React, { useEffect, useRef } from 'react';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './timeline.css';

const TimelineComponent = () => {
  const timelineRef = useRef(null);

  useEffect(() => {
    // Données d'événements
    const events = [
      { message: 'SVC Area : new level 0.05', time: '260.0000' },
      {
        message: 'Voltage regulator : lower limit reached (UsRef)',
        time: '278.0000',
      },
      { message: 'SVC Area : new level -0.2', time: '340.0000' },
      { message: 'SVC Area : new level 0.04', time: '440.0000' },
      { message: 'SVC Area : new level -0.21', time: '480.0000' },
      { message: 'SVC Area : new level 0.03', time: '620.0000' },
      { message: 'SVC Area : new level -0.22', time: '630.0000' },
      { message: 'SVC Area : new level -0.23', time: '770.0000' },
      { message: 'SVC Area : new level 0.02', time: '810.0000' },
      { message: 'SVC Area : new level -0.24', time: '910.0000' },
      { message: 'SVC Area : new level 0.01', time: '990.0000' },
    ];

    // Configuration des items
    const items = new DataSet(
      events.map((event, index) => ({
        id: index + 1,
        content: event.message,
        start: parseFloat(event.time),
        type: 'point',
        title: `${event.message}<br>Temps: ${event.time}`,
      })),
    );

    // Options de la timeline
    const options = {
      height: '300px',
      showCurrentTime: true,
      zoomKey: 'ctrlKey',
      horizontalScroll: true,
      zoomable: true,
      moveable: true,
      orientation: { axis: 'bottom', item: 'top' },
      margin: { item: { vertical: 10, horizontal: 0 } },
      format: {
        minorLabels: { second: 's', minute: 'm' },
        majorLabels: { second: 'HH:mm:ss', minute: 'DD MMM HH:mm' },
      },
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap',
      },
    };

    // Initialisation de la timeline
    const timeline = new Timeline(timelineRef.current, items, options);

    // Définition de la fenêtre visible
    const times = events.map((event) => parseFloat(event.time));
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const margin = (maxTime - minTime) * 0.1;
    timeline.setWindow(minTime - margin, maxTime + margin);

    // Nettoyage
    return () => timeline.destroy();
  }, []);

  return (
    <div className="events-timeline-container">
      <h2>Timeline des événements système</h2>
      <div ref={timelineRef} />
    </div>
  );
};

export default TimelineComponent;
