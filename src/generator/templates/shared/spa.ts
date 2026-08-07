import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TSpaFragmentId = Extract<TFragmentId, `spa/${string}`>;

export const createSpaFragments: TFragmentFactory<TSpaFragmentId> = (
  context,
) => {
  const { framework, projectKind } = context;

  return {
    'spa/App.css': () => source`#${framework === 'react' ? 'root' : 'app'} {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          overflow-x: clip;
          text-align: center;
          box-sizing: border-box;
        }

        .header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 2rem 0 1.5rem;
        }

        .logo {
          display: inline-flex;
          height: 56px;
        }

        .logo img {
          display: block;
          width: auto;
          height: 100%;
          max-width: min(225px, 70vw);
          object-fit: contain;
          transition: filter 200ms ease;
        }

        .logo img:hover {
          filter: drop-shadow(0 0 1.25rem rgb(255 92 140 / 55%));
        }

        .formHeader,
        .transferLayout {
          width: min(500px, 100%);
          margin-inline: auto;
          box-sizing: border-box;
        }

        .formHeader {
          display: grid;
          gap: 0.75rem;
          padding: 1rem 0 1.5rem;
        }

        .formHeader > *,
        .formHeader select,
        .formHeader button {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        form {
          display: grid;
          gap: 1rem;
          width: 100%;
          padding: 1.25rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
          box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
          box-sizing: border-box;
        }

        label {
          display: grid;
          gap: 0.3rem;
          min-width: 0;
          text-align: left;
          color: #333;
          font-weight: 500;
        }

        label small {
          color: #666;
          font-size: 0.75rem;
          font-weight: 400;
          line-height: 1.4;
        }

        input[type=\"text\"],
        input[type=\"number\"],
        select {
          width: 100%;
          min-width: 0;
          padding: 0.65rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: #fff;
          color: inherit;
          font: inherit;
          box-sizing: border-box;
        }

        select:not([multiple]) {
          padding-right: 2rem;
          appearance: none;
          background-image: url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23333' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\");
          background-repeat: no-repeat;
          background-position: right 0.65rem center;
        }

        input:focus,
        select:focus {
          border-color: #ff5c8c;
          outline: 2px solid rgb(255 92 140 / 20%);
        }

        button {
          width: 100%;
          padding: 0.75rem 1.25rem;
          border: 0;
          border-radius: 4px;
          color: #fff;
          background: #d92d67;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        button:hover:not(:disabled) {
          background: #b42355;
        }

        button:disabled {
          background: #999;
          cursor: not-allowed;
        }

        button.secondary {
          color: #d92d67;
          background: transparent;
          border: 1px solid #d92d67;
        }

        button.secondary:hover:not(:disabled) {
          color: #fff;
          background: #d92d67;
        }

        .transferError {
          width: 100%;
          max-height: 12rem;
          margin: 0;
          padding: 0.65rem 0.75rem;
          overflow: auto;
          color: #b42318;
          background: #fef3f2;
          border: 1px solid #fecdca;
          border-radius: 6px;
          text-align: left;
          overflow-wrap: anywhere;
          box-sizing: border-box;
        }

        .read-the-docs {
          color: #666;
        }
        `,
    'spa/index.css': () => source`:root {
          font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          font-weight: 400;
        
          color: #213547;
          background-color: #ffffff;
        
          font-synthesis: none;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        body {
          margin: 0;
          display: flex;
          place-items: center;
          min-width: 320px;
          min-height: 100vh;${
            projectKind === 'sdk'
              ? source`
          overflow-x: clip;`
              : ''
          }
        }
        
        h1 {
          font-size: 2.8em;
          line-height: 1.1;
          margin: 0;
        }
        
        h4 {
          font-size: 1em;
          font-weight: 500;
          margin: 0;
        }
        `,
    'spa/index.html': () => source`<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/png" href="/paraspell-icon.png" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>ParaSpell XCM ${projectKind === 'api' ? 'API' : 'SDK'} starter</title>
          </head>
          <body>
            <div id="${framework === 'react' ? 'root' : 'app'}"></div>
            <script type="module" src="/src/main.${framework === 'react' ? 'tsx' : 'ts'}"></script>
          </body>
        </html>
        `,
    'spa/toError':
      () => source`export const toError = (error: unknown): Error =>
          error instanceof Error
            ? error
            : error instanceof ErrorEvent
              ? new Error(error.message)
              : new Error("An unknown error occurred");
        `,
  };
};
