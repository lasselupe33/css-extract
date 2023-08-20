import { myCss, myCss2 } from "@dummy/package";
import { createRoot } from "react-dom/client";

function Root() {
  return (
    <div className={myCss}>
      hello world <div className={myCss2}>another</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector("#app")!);

root.render(<Root />);
