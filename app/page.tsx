import { HeroSequence } from "@/components/hero/hero-sequence";

// Homepage = the scroll-driven sequence. Everything else that used to
// live below the hero (trending row, categories, latest uploads) now
// lives in /browse so the homepage stays a single cinematic flow.

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSequence />
    </div>
  );
}
