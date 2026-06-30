---
to: src/swap/exchangeChains.ts
skip_if: <%= (!swap).toString() %>
---
<%- h.includeShared('shared/swap/exchangeChains.api.frontend.ejs.t') %>
