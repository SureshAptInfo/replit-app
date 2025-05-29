import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "LeadTrackPro | Agency CRM Platform";

// Set meta description
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'LeadTrackPro - A powerful multi-tenant CRM platform for agencies to manage leads, automate follow-ups, and boost conversions.';
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
