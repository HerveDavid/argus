import React, { useEffect, useRef } from 'react';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './timeline.css';
import { stack } from 'd3';

const TimelineComponent = () => {
  const timelineRef = useRef(null);

  useEffect(() => {
    // Données d'événements
    const events = [
      {
        message: 'SVC Area : new level 0.05',
        modelName: 'RST_TRI_PP7',
        time: '260.0000',
      },
      {
        message: 'Voltage regulator : lower limit reached (UsRef)',
        modelName: 'DM_TRICAT 3',
        time: '278.0000',
      },
      {
        message: 'SVC Area : new level -0.2',
        modelName: 'RST_NEOULP6',
        time: '340.0000',
      },
      {
        message: 'SVC Area : new level 0.04',
        modelName: 'RST_TRI_PP7',
        time: '440.0000',
      },
      {
        message: 'SVC Area : new level -0.21',
        modelName: 'RST_NEOULP6',
        time: '480.0000',
      },
      {
        message: 'SVC Area : new level 0.03',
        modelName: 'RST_TRI_PP7',
        time: '620.0000',
      },
      {
        message: 'SVC Area : new level -0.22',
        modelName: 'RST_NEOULP6',
        time: '630.0000',
      },
      {
        message: 'SVC Area : new level -0.23',
        modelName: 'RST_NEOULP6',
        time: '770.0000',
      },
      {
        message: 'SVC Area : new level 0.02',
        modelName: 'RST_TRI_PP7',
        time: '810.0000',
      },
      {
        message: 'SVC Area : new level -0.24',
        modelName: 'RST_NEOULP6',
        time: '910.0000',
      },
      {
        message: 'SVC Area : new level 0.01',
        modelName: 'RST_TRI_PP7',
        time: '990.0000',
      },
    ];

    // Configuration des items
    const items = new DataSet(
      events.map((event, index) => ({
        id: index + 1,
        content: event.message,
        start: parseFloat(event.time),
        type: 'point',
        title: `${event.message}<br>Temps: ${event.time}<br>Model: ${event.modelName}`,
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
    <div>
      <h2 className='mb-2'>Timeline</h2>
      <div className="bg-secondary" ref={timelineRef} />
    </div>
  );
};

export default TimelineComponent;
