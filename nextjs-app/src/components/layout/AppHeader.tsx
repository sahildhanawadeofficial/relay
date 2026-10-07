import { BrandLogo } from './BrandLogo';

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <BrandLogo />
        {children ? <div className="app-header-actions">{children}</div> : null}
      </div>
    </header>
  );
}
