import { useEffect, useState } from "react";

export function useDebouncedValue<TValue>(value: TValue, waitTime = 300): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, waitTime);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, waitTime]);

  return debouncedValue;
}
