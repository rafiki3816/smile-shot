import React, { useState, useEffect } from 'react';
import { announcer } from '../utils/announcerUtils';

const ScreenReaderAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('');
  const [priority, setPriority] = useState('polite');

  useEffect(() => {
    const handleAnnounce = (event) => {
      const { message, priority } = event.detail;
      setPriority(priority);
      setAnnouncement(message);
      
      // Clear the announcement after a delay to allow re-announcement of the same message
      setTimeout(() => {
        setAnnouncement('');
      }, 100);
    };

    announcer.addEventListener('announce', handleAnnounce);
    return () => announcer.removeEventListener('announce', handleAnnounce);
  }, []);

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ display: priority === 'polite' ? 'block' : 'none' }}
      >
        {priority === 'polite' && announcement}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{ display: priority === 'assertive' ? 'block' : 'none' }}
      >
        {priority === 'assertive' && announcement}
      </div>
    </>
  );
};

export default ScreenReaderAnnouncer;