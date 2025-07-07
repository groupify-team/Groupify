// Performance utility functions
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
};

export const measureAsyncPerformance = async (name, fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
};

export const logComponentRender = (componentName) => {
  console.log(`🔄 ${componentName} rendered at ${new Date().toISOString()}`);
};

export const logHookExecution = (hookName, dependencies) => {
  console.log(`🎣 ${hookName} executed`, dependencies);
};
