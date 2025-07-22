// This is a monkey patch to filter out the data-lov-id attribute from all React components
// It works by intercepting React's createElement function and removing the attribute before it's passed to components

// Create a function to filter out data-lov-id from props
function filterLovId(props: any): any {
  if (!props || typeof props !== 'object') return props;
  
  // Create a shallow copy of props without data-lov-id
  const newProps = { ...props };
  if ('data-lov-id' in newProps) {
    delete newProps['data-lov-id'];
  }
  return newProps;
}

// Patch React.createElement after the module has loaded
if (typeof window !== 'undefined') {
  // Wait for React to be fully loaded
  setTimeout(() => {
    try {
      // Get a reference to React
      const React = require('react');
      
      // Store the original createElement
      const originalCreateElement = React.createElement;
      
      // Override createElement with our filtered version
      // @ts-ignore - We're intentionally monkey-patching React
      React.createElement = function() {
        // Filter props (second argument) if it exists
        if (arguments.length > 1 && arguments[1] !== null && arguments[1] !== undefined) {
          arguments[1] = filterLovId(arguments[1]);
        }
        return originalCreateElement.apply(this, arguments as any);
      };
      
      console.log('React patch applied: data-lov-id attributes will be filtered');
    } catch (e) {
      console.error('Failed to apply React patch:', e);
    }
  }, 0);
}

export const reactPatchesApplied = true; 