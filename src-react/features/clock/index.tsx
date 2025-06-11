import moment from 'moment';
import { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(moment());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.format('D MMMM HH:mm:ss');

  return (
    <div className="flex items-center h-full text-sm font-medium">
      {formattedTime}
    </div>
  );
};

export default Clock;
