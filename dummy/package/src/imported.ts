import { css } from "@css-extract/core";

export const test = 2;

export function resultingValue() {
  return test + test;
}

export const myCss = css`
  color: ${test};
`;

export const forShaker2 = css`
  background: green;
`;

throw new Error("destruction!");
