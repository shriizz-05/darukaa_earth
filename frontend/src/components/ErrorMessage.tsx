import type { ReactNode } from "react";

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div className="error-banner" role="alert">
      {children}
    </div>
  );
}
