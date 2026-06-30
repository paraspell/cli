---
to: src/swap/index.ts
skip_if: <%= (!swap).toString() %>
---
<%- h.includeShared('shared/swap/index.api.ejs.t') %>
