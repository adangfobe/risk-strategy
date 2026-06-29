/** Deduplicate in-flight simulations by setup key (survives React Strict Mode remounts). */
const inFlight = new Map<string, Promise<unknown>>();

export function getInFlightSimulation<T>(key: string): Promise<T> | undefined {
  return inFlight.get(key) as Promise<T> | undefined;
}

export function registerSimulation<T>(key: string, promise: Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const registered = promise.finally(() => {
    if (inFlight.get(key) === registered) {
      inFlight.delete(key);
    }
  });
  inFlight.set(key, registered);
  return registered;
}

export function clearSimulation(key: string): void {
  inFlight.delete(key);
}
