import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);

  const toggle = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported');
      return;
    }
    if (!enabled) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setEnabled(true);
        toast.success('Notifications enabled');
      } else {
        toast.error('Permission denied');
      }
    } else {
      setEnabled(false);
      toast.success('Notifications disabled');
    }
  };

  return (
    <button onClick={toggle} className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-purple-600' : 'bg-gray-700'}`}>
      <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}
