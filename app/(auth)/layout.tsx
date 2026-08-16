/**
 * The auth screens are a deliberately dark design: `AuthBackground` paints an
 * opaque `#070810` ground and the glass card is a fixed dark translucent panel.
 *
 * That only breaks when the *text* follows the app theme -- in light mode
 * `--color-text-primary` flips to near-black and renders dark-on-dark inside
 * the card. Pinning the token here keeps the screen readable in both themes
 * without touching every `var(--color-text-primary)` usage in the pages.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-screen">{children}</div>;
}
