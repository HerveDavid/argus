import { useState, useEffect } from 'react';
import moment from 'moment';

export const Clock = () => {
  const [time, setTime] = useState(moment());

  useEffect(() => {
    // Update time every 5 seconds
    const timer = setInterval(() => {
      setTime(moment());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.format('HH:mm:ss');

  return (
    <div className="flex items-center h-full text-sm font-medium">
      {formattedTime}
    </div>
  );
};
