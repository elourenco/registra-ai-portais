import { type ReactNode, useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

import { Skeleton } from "../components/skeleton";
import { cn } from "../lib/cn";

interface Size {
  width: number;
  height: number;
}

interface ChartResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
}

function hasPositiveSize(size: Size): boolean {
  return size.width > 0 && size.height > 0;
}

export function ChartResponsiveContainer({
  children,
  className,
  fallback,
}: ChartResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [shouldRenderChart, setShouldRenderChart] = useState(false);
  const [isChartVisible, setIsChartVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const nextSize = {
        width: element.clientWidth,
        height: element.clientHeight,
      };

      setSize((currentSize) => {
        if (
          currentSize.width === nextSize.width &&
          currentSize.height === nextSize.height
        ) {
          return currentSize;
        }

        return nextSize;
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasPositiveSize(size)) {
      setShouldRenderChart(false);
      setIsChartVisible(false);

      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRenderChart(true);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [size]);

  useEffect(() => {
    if (!shouldRenderChart) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsChartVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [shouldRenderChart]);

  return (
    <div ref={containerRef} className={cn("h-full w-full min-w-0", className)}>
      {shouldRenderChart ? (
        <div
          className={cn(
            "h-full w-full transition-all duration-300 ease-out",
            isChartVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
            debounce={50}
            initialDimension={size}
          >
            {children}
          </ResponsiveContainer>
        </div>
      ) : (
        fallback ?? <Skeleton className="h-full w-full rounded-xl" />
      )}
    </div>
  );
}
