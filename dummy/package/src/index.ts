import { css } from "@css-extract/core";

import { resultingValue, test, myCss as myCss2 } from "./imported";
import "./test";
import "./irrelevant";

export { myCss2 };

import "./global";
import "./formatted-list.style";
import "./third";

const green = "red";

console.log("hi");

export const myCss = css`
  height: 1000px;
  width: ${resultingValue() * 10}px;
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
