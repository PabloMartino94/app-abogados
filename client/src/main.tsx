import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ApiProvider } from "@/lib/api";

createRoot(document.getElementById("root")!).render(
  <ApiProvider>
    <App />
  </ApiProvider>,
);
