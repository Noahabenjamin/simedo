"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, type MouseEvent } from "react";

type Props = {
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  onClick?: () => void;
  children: ReactNode;
};

// Smart "Home" link.
//
// When the user is already on "/", clicking a Home link or the Simedo
// wordmark does nothing under Next.js's same-route shortcut — even though
// the homepage is a 400vh scroll experience and the user is usually deep
// inside it by the time the BlueMenu appears. This component intercepts
// the click in that case and smooth-scrolls back to the top so the hero
// resets to its starting state.
//
// On any other route, behaviour is identical to a plain Link.

export function HomeLink({
  href = "/",
  className,
  style,
  onClick,
  children,
  ...rest
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (cmd+click, etc.) open in new tab as usual.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push(href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
      aria-label={rest["aria-label"]}
    >
      {children}
    </a>
  );
}
