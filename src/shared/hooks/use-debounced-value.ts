import { useEffect, useState } from "react";

export const useDebouncedValue = <Value>(
  value: Value,
  delayInMs: number,
): Value => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayInMs);
    return () => clearTimeout(timer);
  }, [value, delayInMs]);

  return debouncedValue;
};
