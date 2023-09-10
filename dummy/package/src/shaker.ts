import { css } from "@css-extract/core";

import { myCss, test } from "./imported";

const x = 2;
const y = "hi";

console.log(y);

function hello() {
  if (Math.random() > 0.5) {
    return 4;
  } else {
    return 5;
  }
}

type Props = {
  viewport: {
    min: number;
    max: number;
  };
  clamp: {
    min: number;
    max: number;
  };
};

/**
 * linearly clamps a value dynamically based on the current viewport width.
 *
 * @see https://css-tricks.com/linearly-scale-font-size-with-css-clamp-based-on-the-viewport/
 *
 * @example
 * ```
 * linearClamp({ viewport: { min: 100, max: 200 }, clamp: { min: 50, max: 100 } })
 *    // --> 100px IF viewport.innerWidth >= 200px
 *    // --> 75px IF viewport.innerWidth == 150px
 *    // --> 50px IF viewport.innerWidth <= 100px
 * ```
 */
export const linearClamp = (options: Props) => {
  const slope =
    (options.clamp.max - options.clamp.min) /
    (options.viewport.max - options.viewport.min);
  const yAxisIntersection = -options.viewport.min * slope + options.clamp.min;

  return `clamp(${options.clamp.min}, ${yAxisIntersection} + ${slope * 100}, ${
    options.clamp.max
  })`;
};

const another = css`
  color: green;
`;

css`
  z-index: ${test};

  width: ${linearClamp({
    clamp: { min: 30, max: 100 },
    viewport: { max: 100, min: 30 },
  }).toString()};

  background: ${x};

  font: ${hello()};
  color: green;

  .${another} & {
    color: blue;
  }

  .${myCss} & {
    color: red;
  }
`;
