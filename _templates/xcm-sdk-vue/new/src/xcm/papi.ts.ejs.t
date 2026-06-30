---
to: src/xcm/papi.ts
skip_if: <%= (client !== 'papi').toString() %>
---
<%- h.includeShared('shared/xcm/papi.ejs.t') %>
