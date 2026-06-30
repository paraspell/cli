---
to: src/xcm/dedot.ts
skip_if: <%= (client !== 'dedot').toString() %>
---
<%- h.includeShared('shared/xcm/dedot.ejs.t') %>
