// Performance monitoring utilities

// Measure function execution time
export function measurePerformance(fn, label = 'Function') {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      console.log(`${label} took ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`${label} failed after ${(end - start).toFixed(2)}ms:`, error);
      throw error;
    }
  };
}

// React hook for measuring component render time
import { useEffect, useRef } from 'react';

export function useRenderTime(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }

    startTime.current = performance.now();
  });

  return renderCount.current;
}

// Monitor route changes
export function useRoutePerformance() {
  useEffect(() => {
    let startTime;

    const handleRouteStart = () => {
      startTime = performance.now();
    };

    const handleRouteComplete = () => {
      if (startTime) {
        const loadTime = performance.now() - startTime;
        console.log(`Route change took ${loadTime.toFixed(2)}ms`);

        // Send to analytics if needed
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'page_load_time', {
            value: Math.round(loadTime),
            custom_map: { metric1: 'page_load_time' }
          });
        }
      }
    };

    // Listen for route changes
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleRouteStart);
      window.addEventListener('load', handleRouteComplete);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleRouteStart);
        window.removeEventListener('load', handleRouteComplete);
      }
    };
  }, []);
}

// Memory usage monitoring
export function logMemoryUsage() {
  if (typeof performance !== 'undefined' && performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    console.log('Memory Usage:', {
      used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      usage: `${((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2)}%`
    });
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric) {
  console.log('Web Vital:', metric);

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

// Lazy loading helper with performance tracking
export function lazyWithPerformance(importFn, componentName) {
  return lazy(() => {
    const start = performance.now();
    return importFn().then(module => {
      const end = performance.now();
      console.log(`${componentName} loaded in ${(end - start).toFixed(2)}ms`);
      return module;
    });
  });
}

// Bundle size monitoring
export function logBundleSize() {
  // This would be populated by webpack during build
  if (typeof window !== 'undefined' && window.__BUNDLE_ANALYZE__) {
    console.log('Bundle analysis enabled');
  }
}