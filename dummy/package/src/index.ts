import { css } from "@css-extract/core";

import { resultingValue, test, myCss as myCss2 } from "./imported";
import "./test";

import "./global";
import "./formatted-list.style";

const green = "blue";

console.log("hi");

export const myCss = css`
  height: 500px;
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
