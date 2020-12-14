import {expect} from "chai";
import {seqPattern} from "../src/seq_pattern";

describe("seqPattern()", () => {
  const matchTest = (str: string): void => {
    const pat = seqPattern(str);
    const re = new RegExp(`^${pat} `);
    for (let i = 0; i < str.length; i++) {
      expect(re.test(str.slice(0, i) + " ")).to.be.true;
    }
  };

  it("returns regexp", () => {
    expect(seqPattern("")).to.equal("");
    expect(seqPattern("x")).to.equal("x?");
    expect(seqPattern("foo")).to.equal("(?:f(?:oo?)?)?");
    matchTest("foo");
  });

  it("escapes special characters", () => {
    expect(seqPattern("[?")).to.equal("(?:\\[\\??)?");
    matchTest("[?");
    expect(seqPattern("^\\$")).to.equal("(?:\\^(?:\\\\\\$?)?)?");
    matchTest("^\\$");
  });
});
