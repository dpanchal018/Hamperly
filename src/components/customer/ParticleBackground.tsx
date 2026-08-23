'use client';

import { useMemo } from "react";
import { ParticlesProvider, Particles } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

export function ParticleBackground() {
  const options = useMemo(() => ({
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
      },
      modes: {
        grab: {
          distance: 140,
          links: {
            opacity: 0.5,
          },
        },
      },
    },
    particles: {
      color: {
        value: "#ffffff",
      },
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        direction: "none" as const,
        enable: true,
        outModes: {
          default: "bounce" as const,
        },
        random: false,
        speed: 1,
        straight: false,
      },
      number: {
        density: {
          enable: true,
        },
        value: 80,
      },
      opacity: {
        value: 0.5,
      },
      shape: {
        type: "circle" as const,
      },
      size: {
        value: { min: 1, max: 3 },
      },
    },
    detectRetina: true,
  }), []);

  return (
    <ParticlesProvider init={async (engine: Engine) => {
      await loadSlim(engine);
    }}>
      <Particles
        id="tsparticles"
        className="absolute inset-0 z-0 mix-blend-screen"
        options={options}
      />
    </ParticlesProvider>
  );
}
