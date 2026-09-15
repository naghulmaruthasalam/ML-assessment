'use client';

/**
 * Pyodide bootstrap.
 *
 * The runtime is ~10MB, so it is fetched on demand — the first time a
 * learner opens a code ground — and then shared by every lesson for the
 * rest of the session.
 */

const PYODIDE_VERSION = 'v0.26.4';
const CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

export interface PyodideRuntime {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
  globals: { get: (k: string) => unknown };
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideRuntime>;
  }
}

let runtime: PyodideRuntime | null = null;
let pending: Promise<PyodideRuntime> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load the Python runtime.')),
      );
      if (window.loadPyodide) resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('Failed to load the Python runtime.'));
    document.head.appendChild(el);
  });
}

/** Resolves to a shared runtime. Safe to call from several components. */
export function getPyodide(): Promise<PyodideRuntime> {
  if (runtime) return Promise.resolve(runtime);
  if (pending) return pending;

  pending = (async () => {
    await loadScript(`${CDN}pyodide.js`);
    if (!window.loadPyodide) {
      throw new Error('The Python runtime loaded but did not register.');
    }
    runtime = await window.loadPyodide({ indexURL: CDN });
    return runtime;
  })();

  pending.catch(() => {
    // Allow a retry on the next call rather than caching the failure.
    pending = null;
  });

  return pending;
}

export const isPyodideReady = () => runtime !== null;
