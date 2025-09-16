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

  return <h1 className="text-sm font-medium">{formattedTime}</h1>;
};

export default Clock;
