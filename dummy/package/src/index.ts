import { css } from "@css-extract/core";

import { resultingValue, test, myCss as myCss2 } from "./imported";
import "./test";

export { myCss2 };

import "./global";
import "./formatted-list.style";
import "./third";

const green = "green";

console.log("hi");

export const myCss = css`
  height: 800px;
  width: ${resultingValue() * 400}px;
  background: ${green};
  align-self: end;
`;

export const another = css`
  background: ${resultingValue()};
  color: green;

  & .test {
    color: blue;
  }

  & .${myCss} {
    background: red;
  }

  & .${myCss2} {
    background: green;
  }
`;

function startUp() {
  console.log("started");
}

startUp();
