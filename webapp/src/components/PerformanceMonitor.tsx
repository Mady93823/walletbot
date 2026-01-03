import { useEffect } from 'react';
import { onCLS, onINP, onLCP, onTTFB, onFCP } from 'web-vitals';

// Simple logger for demonstration. In production, send to analytics endpoint.
const logMetric = (metric: any) => {
  // Filter out non-critical logs or send to backend
  console.log(`[Performance] ${metric.name}:`, metric.value, metric);
  
  // Example: Send to backend
  // if (navigator.sendBeacon) {
  //   navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(metric));
  // }
};

export const PerformanceMonitor = () => {
  useEffect(() => {
    // Web Vitals
    onCLS(logMetric);
    onINP(logMetric);
    onLCP(logMetric);
    onTTFB(logMetric);
    onFCP(logMetric);

    // Resource Timing API to track asset loading
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Only log slow assets (> 500ms) or errors
        if (entry.duration > 500) {
            console.warn(`[Slow Asset] ${entry.name} took ${Math.round(entry.duration)}ms`);
        }
      });
    });

    try {
        observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
        console.warn('PerformanceObserver not supported');
    }

    return () => observer.disconnect();
  }, []);

  return null; // Renderless component
};
