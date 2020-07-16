export const domReady = (fn: () => void) => {
  // @ts-ignore
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    return fn();
  }

  document.addEventListener('DOMContentLoaded', fn);
};
