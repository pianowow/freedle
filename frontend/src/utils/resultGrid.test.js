import { createPinia, setActivePinia } from "pinia";
import { buildResultGrid } from "./resultGrid";
import { useSettingsStore } from "../stores/settingsStore";

describe("resultGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("builds the expected share text for a win", () => {
    expect(
      buildResultGrid({
        guesses: ["CARVE", "CRONE", "CRANE", "", "", ""],
        target: "CRANE",
        wordLength: 5,
      }),
    ).toBe(
      [
        "Freedle — 3 Guesses! ⭐",
        "🟩🟨🟨⬛🟩",
        "🟩🟩⬛🟩🟩",
        "🟩🟩🟩🟩🟩",
        "Can you beat my score?!",
      ].join("\n"),
    );
  });

  it("builds the expected share text for a loss", () => {
    expect(
      buildResultGrid({
        guesses: ["BEAR", "COIL", "MIND", "SING", "POND", "FROG"],
        target: "LION",
        wordLength: 4,
      }),
    ).toBe(
      [
        "Freedle — Loss! 😖",
        "⬛⬛⬛⬛",
        "⬛🟨🟨🟨",
        "⬛🟩🟨⬛",
        "⬛🟩🟨⬛",
        "⬛🟨🟨⬛",
        "⬛⬛🟩⬛",
        "Can you solve it?!",
      ].join("\n"),
    );
  });

  it("does not change when hard mode and count mode are enabled", () => {
    const settingsStore = useSettingsStore();
    const baseline = buildResultGrid({
      guesses: ["CARVE", "CRONE", "CRANE", "", "", ""],
      target: "CRANE",
      wordLength: 5,
    });

    settingsStore.setHardMode(true);
    settingsStore.setCountMode(true);

    expect(
      buildResultGrid({
        guesses: ["CARVE", "CRONE", "CRANE", "", "", ""],
        target: "CRANE",
        wordLength: 5,
      }),
    ).toBe(baseline);
  });

  it("omits idle rows and rows after the winning guess", () => {
    const result = buildResultGrid({
      guesses: ["CARVE", "CRANE", "", "PLANE", "", ""],
      target: "CRANE",
      wordLength: 5,
    });

    expect(result).toBe(
      [
        "Freedle — 2 Guesses! ⭐",
        "🟩🟨🟨⬛🟩",
        "🟩🟩🟩🟩🟩",
        "Can you beat my score?!",
      ].join("\n"),
    );
  });
});
