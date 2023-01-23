import { add } from "../src/a";

describe("jest test", () => {
  test("foo", () => {
    expect(add(1, 1)).toBe(2);
  });
});
