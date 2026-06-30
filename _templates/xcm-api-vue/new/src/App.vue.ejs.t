---
to: src/App.vue
---
<script setup lang="ts">
import "./App.css";
import XcmTransfer from "./XcmTransfer.vue";
</script>

<template>
  <div class="header">
    <h1>Vite + Vue +</h1>
    <a
      href="https://paraspell.github.io/docs/xcm-api/getting-started.html"
      target="_blank"
      rel="noopener noreferrer"
      class="logo"
    >
      <img
        src="/lightspell.png"
        alt="ParaSpell logo"
      >
    </a>
  </div>
  <XcmTransfer />
  <p class="read-the-docs">
    Click on the LightSpell logo to read the docs
  </p>
  <p class="read-the-docs">
    <a
      href="https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html"
      target="_blank"
      rel="noopener noreferrer"
    >
      Click here
    </a>
    to learn more about how you can deploy the API yourself
  </p>
</template>
