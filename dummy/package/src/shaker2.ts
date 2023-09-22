import { css } from "@css-extract/core";

import { myDependency } from "./common-dependency";
import { forShaker2 } from "./imported";

css`
  color: ${myDependency};

  & .${forShaker2} {
    color: red;
  }
`;
