import { Bell } from 'lucide-react';
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

  const formattedTime = time.format('D MMM HH:mm:ss');

  return (
    <div className="flex items-center gap-2">
      <Bell size={14} />
      <h1 className="text-sm font-medium">{formattedTime}</h1>
    </div>
  );
};

export default Clock;
