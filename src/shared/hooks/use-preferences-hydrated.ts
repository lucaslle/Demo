import { useSyncExternalStore } from "react";
import { usePreferencesStore } from "../stores/preferences-store";

const subscribeToHydration = (onChange: () => void) =>
  usePreferencesStore.persist.onFinishHydration(onChange);

const readHasHydrated = () => usePreferencesStore.persist.hasHydrated();

export const usePreferencesHydrated = (): boolean =>
  useSyncExternalStore(subscribeToHydration, readHasHydrated, () => false);
