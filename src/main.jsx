import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { reloadForNewBuild } from "./utils/lazy-page";

// Vite segnala qui i file collegati (CSS e moduli condivisi) che non si trovano più dopo un aggiornamento del portale.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewBuild()) event.preventDefault();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import "./styles/experience.css";

import "./styles/portal-revision.css";
import "./styles/journey.css";
import "./styles/delight.css";
import "./styles/polish.css";
import "./styles/cards.css";
import "./styles/page-title.css";
import "./styles/feedback.css";
import "./services/card-glow";
