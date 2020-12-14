const SPECIAL_CHARACTERS = ["[", "\\", "^", "$", ".", "|", "?", "*", "+", "(", ")"];

function escape(char: string): string {
  if (0 <= SPECIAL_CHARACTERS.indexOf(char)) {
    return `\\${char}`;
  } else {
    return char;
  }
}

export function seqPattern(seq: string): string {
  if (seq.length === 0) {
    return seq;
  }
  const chars = seq.split("").map(escape);
  let len = chars.length - 1;
  let pattern = `${chars[len]}?`;
  while (0 <= --len) {
    pattern = `(?:${chars[len]}${pattern})?`;
  }
  return pattern;
}
