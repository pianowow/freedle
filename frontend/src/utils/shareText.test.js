import { buildShareText, buildShareUrlForGame, copyTextToClipboard } from "./shareText";
import { parseShareParams } from "./shareLink";

describe("shareText", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("builds daily share text with the result grid and a daily share URL", async () => {
    const text = await buildShareText({
      guesses: ["CARVE", "CRONE", "CRANE", "", "", ""],
      targetWord: "CRANE",
      wordLength: 5,
      isDailyGame: true,
      currentDictionaryVersion: 1,
      currentDailyDate: "2026-04-28",
      currentRandomSeed: null,
    });

    const [header, row1, row2, row3, cta, url] = text.split("\n");
    const parsed = parseShareParams(new URL(url).searchParams);

    expect([header, row1, row2, row3, cta].join("\n")).toBe(
      [
        "Freedle — 3 Guesses! ⭐",
        "🟩🟨🟨⬛🟩",
        "🟩🟩⬛🟩🟩",
        "🟩🟩🟩🟩🟩",
        "Can you beat my score?!",
      ].join("\n"),
    );
    expect(parsed).toMatchObject({
      type: "daily",
      version: 1,
      date: "2026-04-28",
      length: 5,
    });
  });

  it("builds random share text with a random share URL", async () => {
    const url = await buildShareUrlForGame({
      isDailyGame: false,
      currentDictionaryVersion: 1,
      currentDailyDate: "",
      currentRandomSeed: 23457283,
      targetWord: "PLANET",
    });

    const parsed = parseShareParams(new URL(url).searchParams);

    expect(parsed).toMatchObject({
      type: "random",
      version: 1,
      seed: 23457283,
      length: 6,
    });
  });

  it("rejects missing share metadata", async () => {
    await expect(
      buildShareUrlForGame({
        isDailyGame: true,
        currentDictionaryVersion: 1,
        currentDailyDate: "",
        currentRandomSeed: null,
        targetWord: "CRANE",
      }),
    ).rejects.toThrow("Daily share date is unavailable.");

    await expect(
      buildShareUrlForGame({
        isDailyGame: false,
        currentDictionaryVersion: 1,
        currentDailyDate: "",
        currentRandomSeed: null,
        targetWord: "CRANE",
      }),
    ).rejects.toThrow("Random share seed is unavailable.");
  });

  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn(async () => {});

    await copyTextToClipboard("share text", {
      clipboard: { writeText },
    });

    expect(writeText).toHaveBeenCalledWith("share text");
  });

  it("falls back to document.execCommand when navigator.clipboard is unavailable", async () => {
    const execCommand = vi.fn(() => true);

    await copyTextToClipboard("share text", {
      clipboard: null,
      documentRef: {
        body: document.body,
        createElement: document.createElement.bind(document),
        execCommand,
      },
    });

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
