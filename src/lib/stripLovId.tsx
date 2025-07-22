import React from "react";

/**
 * A higher-order component that removes the `data-lov-id` attribute from props
 * to prevent React warnings when it's passed to components that don't support it.
 */
export function withoutLovId<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithoutLovIdWrapper(props: P) {
    // Create a new props object without data-lov-id
    const cleanProps = { ...props } as any;
    delete cleanProps["data-lov-id"];
    
    // Pass the cleaned props to the wrapped component
    return <Component {...(cleanProps as P)} />;
  };
}

/**
 * A utility function to strip the `data-lov-id` attribute from props
 * for use in functional components.
 */
export function stripLovId<T extends object>(props: T): T {
  const cleanProps = { ...props } as any;
  delete cleanProps["data-lov-id"];
  return cleanProps as T;
} 