let autoIncrementedId = 0;

export function css(
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number>
): string {
  const hash = `_${autoIncrementedId++}`;

  const css = _strings
    .map((val, index) => `${val}${_exprs[index] ?? ""}`)
    .join("");

  const error = new Error("");
  const trace = error.stack;
  const fileName = trace
    ?.split("\n")[2]
    ?.trim()
    .replace("at file:///virtual/", "")
    .split(":")
    .slice(0, -2)
    .join(":");

  console.log({ hash, css, fileName });

  return hash;

  // @ts-expect-error basically a string, right? :)
  // return {
  //   __extractableCss: true,
  //   process(fileName: string, report = true) {
  //     const hash = `_${autoIncrementedId++}`;

  //     if (report) {
  //       const css = _strings
  //         .map((val, index) => `${val}${_exprs[index] ?? ""}`)
  //         .join("");

  // console.log(JSON.stringify({ __extracted: true, fileName, hash, css })); }

  //     return hash;
  //   },
  // };
}
