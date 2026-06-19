"use client";

// The 3D experience is mounted client-only (ssr:false) so WebGL never runs on
// the server. While the scene boots, a light-premium loader holds the frame.

import dynamic from "next/dynamic";

const AurelisExperience = dynamic(
  () => import("@/components/experience/AurelisExperience"),
  {
    ssr: false,
    loading: () => <ExperienceLoader />,
  },
);

function ExperienceLoader() {
  return (
    <div className="boot">
      <div className="boot__orb" />
      <p className="boot__brand">AURELIS</p>
      <p className="boot__hint">Preparing the boutique</p>
    </div>
  );
}

export default function Page() {
  return (
    <main className="page">
      <AurelisExperience />
    </main>
  );
}
