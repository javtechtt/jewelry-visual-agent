import Link from "next/link";

// Branded 404 so a bad path keeps the luxury illusion instead of the bare
// default Next.js page.
export default function NotFound() {
  return (
    <div className="scene-fallback">
      <p className="scene-fallback__brand">AURELIS</p>
      <p className="scene-fallback__msg">This page wandered off. Let&rsquo;s return you to the boutique.</p>
      <Link className="action-btn action-btn--accent" href="/">
        Return to Aurelis
      </Link>
    </div>
  );
}
