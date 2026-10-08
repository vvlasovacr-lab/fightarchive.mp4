export const log = (scope, message, extra = {}) => {
  const payload = Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : '';
  console.log(`[${scope}] ${message}${payload}`);
};
export const error = (scope, message, extra = {}) => {
  const payload = Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : '';
  console.error(`[${scope}] ${message}${payload}`);
};
