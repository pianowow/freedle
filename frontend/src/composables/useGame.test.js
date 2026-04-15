import { evaluateTileColor, validateHardModeGuess } from "./useGame";

describe("evaluateTileColor", () => {
  it("marks exact matches as correct", () => {
    expect(evaluateTileColor("CRANE", "CRATE", 0)).toBe("correct");
    expect(evaluateTileColor("CRANE", "CRATE", 1)).toBe("correct");
  });

  it("handles duplicate letters without overcounting present tiles", () => {
    expect(evaluateTileColor("PUPPY", "APPLE", 0)).toBe("present");
    expect(evaluateTileColor("PUPPY", "APPLE", 2)).toBe("correct");
    expect(evaluateTileColor("PUPPY", "APPLE", 3)).toBe("absent");
  });

  it("returns absent for letters not in the target", () => {
    expect(evaluateTileColor("CRANE", "PILOT", 0)).toBe("absent");
  });
});

describe("validateHardModeGuess", () => {
  it("requires previously revealed green letters to stay fixed", () => {
    expect(validateHardModeGuess(["CIGAR"], "RABID", "CANDY")).toBe(
      "Position 1 must be C",
    );
  });

  it("requires previously revealed yellow letters to be reused", () => {
    expect(validateHardModeGuess(["ROAST"], "CYNIC", "CANDY")).toBe(
      "Guess must contain A",
    );
  });

  it("allows guesses that satisfy all revealed hints", () => {
    expect(validateHardModeGuess(["CIGAR", "ROAST"], "CARGO", "CANDY")).toBe("");
  });
});
