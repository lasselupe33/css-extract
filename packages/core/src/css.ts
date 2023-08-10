let autoIncrementedId = 0;

export function css(
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number>
): string {
  // @ts-expect-error basically a string, right? :)
  return {
    __extractableCss: true,
    process(fileName: string, report = true) {
      const hash = `_${autoIncrementedId++}`;

      if (report) {
        const css = _strings
          .map((val, index) => `${val}${_exprs[index] ?? ""}`)
          .join("");

        console.log(JSON.stringify({ __extracted: true, fileName, hash, css }));
      }

      return hash;
    },
  };
}
