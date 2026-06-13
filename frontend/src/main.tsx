import Providers from "@/components/providers";
import { createRoot } from "react-dom/client";
import "./index.css";

const targetElement = document.querySelector("#root") as HTMLElement;
const rootElement = createRoot(targetElement);

rootElement.render(<Providers />);
