import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Creates a Chart.js instance on mount / whenever `deps` change, and
 * destroys it on unmount or before re-creating — mirrors the
 * destroy-then-recreate pattern the original vanilla app used.
 */
export function useChart(buildConfig, deps) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const ctx = canvasRef.current.getContext('2d');
    const config = buildConfig(ctx);
    chartRef.current = new Chart(ctx, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}
