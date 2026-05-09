import { describe, it, expect } from "vitest";
import { buildCSV } from "./Reports.tsx";

describe("buildCSV (Reports CSV helper)", () => {
  it("empty rows produces just the header line", () => {
    const csv = buildCSV([], ["Name", "Section"]);
    expect(csv).toBe('"Name","Section"');
  });

  it("escapes headers that contain commas", () => {
    const csv = buildCSV([], ["a,b", "c"]);
    // JSON.stringify wraps in quotes; embedded comma is preserved inside the quoted field
    expect(csv).toBe('"a,b","c"');
  });

  it("escapes values that contain quotes", () => {
    const csv = buildCSV(
      [{ Note: 'He said "hi"' }],
      ["Note"],
    );
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('"Note"');
    // Embedded quotes must be escaped (JSON.stringify uses backslash-quote)
    expect(lines[1]).toBe('"He said \\"hi\\""');
  });

  it("renders a simple data row in column order", () => {
    const csv = buildCSV(
      [{ Name: "Ali", Section: "Saint-Laurent" }],
      ["Name", "Section"],
    );
    expect(csv).toBe('"Name","Section"\n"Ali","Saint-Laurent"');
  });

  it("substitutes empty string for null/undefined values", () => {
    const csv = buildCSV(
      [{ Name: "Ali", Section: null as unknown as string }],
      ["Name", "Section"],
    );
    expect(csv).toBe('"Name","Section"\n"Ali",""');
  });
});
