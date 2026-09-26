import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: `What is ${APP_NAME}? The story, the mission, and what we're building.`,
};

export default function AboutPage() {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">About {APP_NAME}</h1>

      <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
        <p>
          {APP_NAME} is a modern, multi-language OTT (over-the-top) streaming platform that brings
          movies and series from across the world to a single, beautifully simple interface.
          Whether you&apos;re in the mood for an edge-of-your-seat thriller, a sweeping romance,
          an intimate documentary, or a family-friendly animation, {APP_NAME} is built to help
          you find something worth watching — and then get out of the way so you can actually
          watch it.
        </p>

        <p>
          We started {APP_NAME} with a simple conviction: streaming should feel personal. Most
          platforms treat every viewer the same, surfacing the same trending titles to a
          teenager in Mumbai and a grandmother in Madrid. We think that&apos;s a missed
          opportunity. So {APP_NAME} lets you create up to five profiles per account — each with
          its own watchlist, watch history, ratings, and recommendation profile. A kids profile
          restricts content to titles rated ALL or 7+; an adult profile can unlock the full
          catalog.
        </p>

        <p>
          On the technology side, we use adaptive bitrate (HLS) streaming so the player
          automatically adjusts quality to match your connection — from crisp 4K UHD on a fast
          home network down to data-saving SD on a flaky mobile hotspot. Subtitles and
          multiple audio languages are first-class, not afterthoughts. The player remembers
          where you left off and resumes seamlessly across devices.
        </p>

        <p>
          Content on {APP_NAME} is sourced responsibly. We only host titles that we own, that we
          have properly licensed from rights holders, or that are in the public domain. The
          development demo uses freely-redistributable test streams (Big Buck Bunny, Sintel,
          Tears of Steel, and similar) so that the player, the catalog UX, and the
          recommendation engine can be exercised end-to-end without involving any copyrighted
          third-party material. When we onboard commercial catalogs in production, every title
          is paired with a written license.
        </p>

        <p>
          {APP_NAME} is being built in the open as a reference implementation of what a modern,
          ethical streaming platform can look like — fast, accessible, multilingual, and
          committed to respecting both viewer privacy and creator rights. We&apos;d love to hear
          what you think. Drop us a note on the{" "}
          <a className="text-primary hover:underline" href="/contact">
            Contact
          </a>{" "}
          page.
        </p>
      </div>
    </article>
  );
}
