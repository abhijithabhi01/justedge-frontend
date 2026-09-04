import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Creates a Chart.js instance on mount / whenever `deps` change, and
 * destroys it on unmount or before re-creating.
 * If buildConfig returns null/undefined, no chart is created (empty-state UIs).
 */
export function useChart(buildConfig, deps) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const ctx = canvasRef.current.getContext('2d');
    const config = buildConfig(ctx);
    if (!config) {
      chartRef.current?.destroy();
      chartRef.current = null;
      return undefined;
    }
    chartRef.current = new Chart(ctx, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}