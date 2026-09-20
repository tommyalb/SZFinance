import { useEffect, useState } from 'react';

export default function DateTimeWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  return <section className="datetime-widget matte-card"><div className="datetime-icon">◷</div><div><span className="datetime-label">Today</span><strong>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong><small>{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small></div></section>;
}
