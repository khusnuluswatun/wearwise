"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

export const useFadeUp = (selector: string, delay = 0) => {
   useEffect(() => {
      gsap.from(selector, {
         y: 40,
         opacity: 0,
         duration: 1,
         delay,
         ease: "power2.out",
      });
   }, [selector, delay]);
};

export const useStagger = (selector: string) => {
   useEffect(() => {
      gsap.from(selector, {
         y: 30,
         opacity: 0,
         duration: 0.8,
         stagger: 0.15,
         ease: "power2.out",
      });
   }, [selector]);
};

export const useHoverScale = (selector: string) => {
   useEffect(() => {
      const elements = document.querySelectorAll(selector);

      elements.forEach((el: any) => {
         el.addEventListener("mouseenter", () => {
            gsap.to(el, { scale: 1.04, duration: 0.2 });
         });
         el.addEventListener("mouseleave", () => {
            gsap.to(el, { scale: 1, duration: 0.2 });
         });
      });
   }, [selector]);
};