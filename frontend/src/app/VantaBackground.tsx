"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function VantaBackground({ children }: { children: React.ReactNode }) {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Ensure we are running in the browser, not the server
    if (typeof window !== "undefined") {
      
      // 2. Force THREE onto the window BEFORE Vanta loads
      (window as any).THREE = THREE;

      // @ts-ignore
      import("vanta/dist/vanta.dots.min").then((Vanta) => {
        const DOTS = Vanta.default || Vanta;

        if (!vantaEffect && vantaRef.current) {
          setVantaEffect(
            DOTS({
              el: vantaRef.current,
              THREE: THREE,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.00,
              minWidth: 200.00,
              scale: 1.00,
              scaleMobile: 1.00,
              color: 0x203dff,
              color2: 0x3200ef,
              backgroundColor: 0xffffff,
              spacing: 35.00,
              showLines: false,
            })
          );
        }
      });
    }

    // Clean up the animation when leaving the page to prevent memory leaks
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div className="relative min-h-screen w-full">
      {/* The background canvas container */}
      <div 
        ref={vantaRef} 
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none" 
      />
      
      {/* Your website content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}