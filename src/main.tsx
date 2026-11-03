import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./index.css";
import "preline";
import App from "./App.tsx";
import { migrateBookingsOrigin } from "@/lib/originMigration";

if (!migrateBookingsOrigin()) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
