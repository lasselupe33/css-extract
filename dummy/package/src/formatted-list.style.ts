import { css } from "@css-extract/core";

export const formattedListCls = css`
  & > *:nth-child(n + 2)::before {
    content: attr(data-sep);
  }

  & > * + *:last-child::before {
    content: attr(data-final-sep);
  }
`;
