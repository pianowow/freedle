import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { useSettingsStore } from "./settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("accepts supported word lengths and ignores invalid ones", () => {
    const store = useSettingsStore();

    store.setWordLength(4);
    expect(store.wordLength).toBe(4);

    store.setWordLength(7);
    expect(store.wordLength).toBe(4);
  });

  it("persists updated settings to localStorage", async () => {
    const store = useSettingsStore();

    store.setWordLength(6);
    store.setHardMode(true);
    store.setCountMode(true);
    await nextTick();

    expect(JSON.parse(localStorage.getItem("freedle-settings"))).toEqual({
      wordLength: 6,
      hardMode: true,
      countMode: true,
    });
  });
});
