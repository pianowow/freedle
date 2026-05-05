import {
  buildDailyShareUrl,
  buildRandomShareUrl,
  hashWord,
  parseShareParams,
  verifyShare,
} from "./shareLink";

function encodeBase64Url(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

describe("shareLink", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/play?existing=1#section");
  });

  it("builds, parses, and verifies daily share links", async () => {
    const url = await buildDailyShareUrl({
      version: 1,
      date: "2026-04-28",
      word: "crane",
    });
    const parsed = parseShareParams(new URL(url).searchParams);

    expect(url.startsWith(window.location.origin)).toBe(true);
    expect(new URL(url).pathname).toBe("/play");
    expect(parsed).toEqual({
      type: "daily",
      version: 1,
      date: "2026-04-28",
      length: 5,
      hash: await hashWord("CRANE"),
    });
    await expect(verifyShare(parsed, "crane")).resolves.toBe(true);
  });

  it("builds, parses, and verifies random share links", async () => {
    const url = await buildRandomShareUrl({
      version: 1,
      seed: 23457283,
      word: "planet",
    });
    const parsed = parseShareParams(new URL(url).searchParams);

    expect(parsed).toEqual({
      type: "random",
      version: 1,
      seed: 23457283,
      length: 6,
      hash: await hashWord("PLANET"),
    });
    await expect(verifyShare(parsed, "planet")).resolves.toBe(true);
  });

  it("rejects verification when the candidate word changes", async () => {
    const url = await buildDailyShareUrl({
      version: 1,
      date: "2026-04-28",
      word: "crane",
    });
    const parsed = parseShareParams(new URL(url).searchParams);

    await expect(verifyShare(parsed, "slate")).resolves.toBe(false);
  });

  it("rejects malformed or invalid share payloads", () => {
    expect(parseShareParams(new URLSearchParams({ d: "%" }))).toBeNull();

    expect(
      parseShareParams(
        new URLSearchParams({
          d: encodeBase64Url("1:2026-04-28:5"),
        }),
      ),
    ).toBeNull();

    expect(
      parseShareParams(
        new URLSearchParams({
          d: encodeBase64Url("x:2026-04-28:5:1234567890abcdef"),
        }),
      ),
    ).toBeNull();

    expect(
      parseShareParams(
        new URLSearchParams({
          r: encodeBase64Url("1:not-a-seed:5:1234567890abcdef"),
        }),
      ),
    ).toBeNull();

    expect(
      parseShareParams(
        new URLSearchParams({
          d: encodeBase64Url("1:2026-02-30:5:1234567890abcdef"),
        }),
      ),
    ).toBeNull();
  });
});
