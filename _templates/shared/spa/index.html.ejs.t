<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ParaSpell XCM <%= projectKind === 'api' ? 'API' : 'SDK' %> - template</title>
  </head>
  <body>
    <div id="<%= framework === 'react' ? 'root' : 'app' %>"></div>
    <script type="module" src="/src/main.<%= framework === 'react' ? 'tsx' : 'ts' %>"></script>
  </body>
</html>
