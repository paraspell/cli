---
to: src/App.tsx
---
import "./App.css";
import XcmTransfer from "./XcmTransfer";

const App = () => (
  <>
    <div className="header">
      <h1>Vite + React + </h1>
      <a
        href="https://paraspell.github.io/docs/xcm-api/getting-started.html"
        target="_blank"
        rel="noopener noreferrer"
        className="logo"
      >
        <img src="/lightspell.png" alt="ParaSpell logo" />
      </a>
    </div>
    <XcmTransfer />
    <p className="read-the-docs">
      Click on the LightSpell logo to read the docs
    </p>
    <p className="read-the-docs">
      <a
        href="https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html"
        target="_blank"
        rel="noopener noreferrer"
      >
        Click here
      </a>{" "}
      to learn more about how you can deploy the API yourself
    </p>
  </>
);

export default App;
