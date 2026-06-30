---
to: src/swap/useExchangeChains.ts
skip_if: <%= (!swap).toString() %>
---
<%- h.includeShared('shared/swap/useExchangeChains.react.ejs.t') %>
