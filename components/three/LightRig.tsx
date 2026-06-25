"use client";

// Soft, warm, gallery-style lighting. Most reflections come from the procedural
// Environment in EnvironmentStage; this rig adds a key (with shadow), a cool
// fill, and a gentle hemisphere wash for the light-premium look.

export default function LightRig() {
  return (
    <>
      <hemisphereLight args={["#fff6e8", "#e8dcc6", 0.6]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[4.5, 6.5, 4]}
        intensity={1.7}
        color="#fff3df"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0002}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-5, 3, -2]} intensity={0.55} color="#dce8ff" />
      <spotLight
        position={[0, 5.5, 2.5]}
        angle={0.6}
        penumbra={1}
        intensity={1.1}
        color="#ffe9c6"
        distance={18}
      />
    </>
  );
}
