You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
horizontal-scroll-gallery.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollGalleryProps {
  children: React.ReactNode;
  className?: string;
  scroller?: React.RefObject<HTMLElement | null>;
  scrollHeight?: string;
}

export function HorizontalScrollGallery({
  children,
  className,
  scroller,
  scrollHeight = "300%",
}: HorizontalScrollGalleryProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState("100vh");

  useEffect(() => {
    const container = scroller?.current;
    if (!container) {
      setStickyHeight("100vh");
      return;
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setStickyHeight(`${entry.contentRect.height}px`);
      }
    });
    ro.observe(container);
    setStickyHeight(`${container.clientHeight}px`);
    return () => ro.disconnect();
  }, [scroller]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!(wrapper && track)) {
      return;
    }

    const getContainer = () => scroller?.current ?? null;

    const update = () => {
      const container = getContainer();
      const viewportTop = container ? container.getBoundingClientRect().top : 0;
      const viewportHeight = container
        ? container.clientHeight
        : window.innerHeight;

      const wrapperRect = wrapper.getBoundingClientRect();
      const scrollableRange = wrapperRect.height - viewportHeight;
      if (scrollableRange <= 0) {
        return;
      }

      const scrolled = viewportTop - wrapperRect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableRange));

      const trackWidth = track.scrollWidth;
      const maxOffset =
        trackWidth - (container?.clientWidth ?? window.innerWidth);
      if (maxOffset <= 0) {
        return;
      }

      track.style.transform = `translateX(-${progress * maxOffset}px)`;
    };

    const scrollTarget = getContainer() ?? window;

    scrollTarget.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(track);
    update();

    return () => {
      scrollTarget.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scroller]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full", className)}
      style={{ height: scrollHeight }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: stickyHeight }}
      >
        <div
          ref={trackRef}
          className="flex h-full w-max gap-4 will-change-transform"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default HorizontalScrollGallery;


demo.tsx
"use client";

import { HorizontalScrollGallery } from "@/components/ui/horizontal-scroll-gallery";
import { useRef } from "react";

export default function HorizontalScrollGalleryDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-y-auto rounded-lg border border-border bg-background"
    >
      <HorizontalScrollGallery scroller={containerRef} scrollHeight="400%">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex h-40 w-56 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-2xl font-bold text-foreground"
          >
            {i}
          </div>
        ))}
      </HorizontalScrollGallery>
    </div>
  );
}

```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
