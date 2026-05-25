const routes = {};
let currentRoute = null;
let currentParams = {};

export function getCurrentRoute() { return currentRoute; }

export function route(pattern, handler) {
  routes[pattern] = handler;
}

function matchPattern(pattern, hash) {
  const patternParts = pattern.split('/');
  const hashParts = hash.split('/');

  if (patternParts.length !== hashParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const key = patternParts[i].slice(1);
      const value = decodeURIComponent(hashParts[i]);
      if (value === undefined) return null;
      params[key] = value;
    } else if (patternParts[i] !== hashParts[i]) {
      return null;
    }
  }
  return params;
}

export function navigate(hash) {
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  window.location.hash = `#${path}`;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';

  for (const [pattern, handler] of Object.entries(routes)) {
    const params = matchPattern(pattern, hash);
    if (params !== null) {
      if (currentRoute === pattern && JSON.stringify(currentParams) === JSON.stringify(params)) {
        return;
      }
      currentRoute = pattern;
      currentParams = params;
      handler(params);
      return;
    }
  }

  navigate('/');
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', handleRoute);
  handleRoute();
}
