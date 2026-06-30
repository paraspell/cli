/// <reference types="vite/client" />
<% if (framework === 'vue') { %>

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
<% } %>
