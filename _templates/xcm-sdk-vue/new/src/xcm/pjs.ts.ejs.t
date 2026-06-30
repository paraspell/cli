---
to: src/xcm/pjs.ts
skip_if: <%= (client !== 'pjs').toString() %>
---
<%- h.includeShared('shared/xcm/pjs.ejs.t') %>
