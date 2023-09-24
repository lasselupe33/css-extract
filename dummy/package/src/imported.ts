import { css } from "@css-extract/core";

export const test = 10;

export function resultingValue() {
  return test + test;
}

export const myCss = css`
  color: ${test};
`;

export const forShaker2 = css`
  background: green;
`;

export const destruction = window.AbortController;
