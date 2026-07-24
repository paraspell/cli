import type { TFragmentFactory, TFragmentId } from './contracts.js';
import { source } from '../source.js';

type TSpaFragmentId = Extract<TFragmentId, `spa/${string}`>;

export const createSpaFragments: TFragmentFactory<TSpaFragmentId> = (
  context,
) => {
  const { framework, projectKind } = context;

  return {
    'spa/App.css': () => source`#${framework === 'react' ? 'root' : 'app'} {
        ${
          projectKind === 'sdk'
            ? source`  width: 100%;
        `
            : ''
        }  max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;${
            projectKind === 'sdk'
              ? source`
          overflow-x: clip;
          box-sizing: border-box;`
              : ''
          }
        }
        
        .header {
          display: flex;
          align-items: center;${
            projectKind === 'sdk'
              ? source`
          justify-content: center;`
              : ''
          }
          gap: 20px;
          margin-bottom: 1.5em;
          margin-top: 2em;
        }
        
        .formHeader {
          width: min(500px, 100%);
          max-width: min(500px, calc(100vw - 4rem));
          margin: 0 auto;
          padding: 20px 20px 48px 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          min-width: 0;
          box-sizing: border-box;
        }
        
        .formHeader > div {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        
        .formHeader select,
        .formHeader button {
          width: 100%;
          box-sizing: border-box;
        }
        
        .logo {
          height: 64px;
        }
        
        .logo img {
          will-change: filter;
          transition: filter 300ms;
          height: 64px;
        }
        
        .logo img:hover {
          filter: drop-shadow(0 0 2em #ff5c8caa);
        }
        
        .read-the-docs {
          color: #888;
        }
        
        .transferLayout {
          width: min(500px, 100%);
          max-width: min(500px, calc(100vw - 4rem));
          margin: 0 auto;
          min-width: 0;
          box-sizing: border-box;
        }
        
        form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 20px;
          min-width: 0;
          box-sizing: border-box;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        label {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          font-weight: 500;
          color: #333;
        }
        
        label small {
          margin-top: 4px;
          font-weight: 400;
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
        
        input[type="text"],
        input[type="number"],
        select {
          padding: 10px;
          padding-right: 10px;
          margin-top: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          background-color: #fff;
          appearance: none;
          transition: border-color 0.3s;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        
        form button,
        button.secondary {
          width: 100%;
          box-sizing: border-box;
        }
        
        select {
          padding-right: 30px;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23333' stroke-width='1.5' fill='none' fill-rule='evenodd'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 12px;
        }
        
        select[multiple] {
          background-image: none;
          padding-right: 10px;
        }
        
        input[type="text"]:focus,
        input[type="number"]:focus,
        select:focus {
          border-color: #66afe9;
          outline: none;
        }
        
        form button {
          margin-top: 12px;
        }
        
        button {
          padding: 12px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          background-color: #007bff;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        button:hover {
          background-color: #0056b3;
        }
        
        button:disabled {
          background-color: #999;
          cursor: not-allowed;
        }
        
        button.secondary {
          background-color: transparent;
          color: #007bff;
          border: 1px solid #007bff;
        }
        
        button.secondary:hover {
          background-color: #007bff;
          color: #fff;
        }
        
        form > label + label {
          margin-top: 10px;
        }
        
        .transferError {
          display: block;
          box-sizing: border-box;
          width: min(500px, 100%);
          max-width: min(500px, calc(100vw - 4rem));
          max-height: 12rem;
          margin: 12px auto 0;
          padding: 10px 12px;
          overflow: auto;
          text-align: left;
          color: #b42318;
          background-color: #fef3f2;
          border: 1px solid #fecdca;
          border-radius: 6px;
          overflow-wrap: anywhere;
          word-break: break-all;
          white-space: pre-wrap;
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
            <link rel="icon" type="image/svg+xml" href="/vite.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>ParaSpell XCM ${projectKind === 'api' ? 'API' : 'SDK'} - template</title>
          </head>
          <body>
            <div id="${framework === 'react' ? 'root' : 'app'}"></div>
            <script type="module" src="/src/main.${framework === 'react' ? 'tsx' : 'ts'}"></script>
          </body>
        </html>
        `,
    'spa/toError': () => source`const toError = (error: unknown): Error =>
          error instanceof Error
            ? error
            : error instanceof ErrorEvent
              ? new Error(error.message)
              : new Error("An unknown error occurred");
        `,
    'spa/vite-env.d': () => source`/// <reference types="vite/client" />
        ${
          framework === 'vue'
            ? source`
        
        declare module "*.vue" {
          import type { DefineComponent } from "vue";
          const component: DefineComponent<object, object, unknown>;
          export default component;
        }
        `
            : ''
        }
        `,
  };
};
