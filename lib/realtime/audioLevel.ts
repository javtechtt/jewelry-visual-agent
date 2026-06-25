// A tiny, render-free channel for the agent's live speech amplitude (0..1).
// The RealtimeClient writes it from a Web Audio analyser on Aurelis's audio
// track; AgentOrb reads it every frame to pulse in time with the voice. It is a
// plain mutable singleton on purpose — routing this through React/Zustand would
// fire a state update ~60x/sec and thrash the whole tree.

export const speechLevel = { value: 0 };
