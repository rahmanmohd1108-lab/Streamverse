import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Content Policy",
  description: `What content is permitted on ${APP_NAME}, and what is prohibited.`,
};

export default function ContentPolicyPage() {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Content Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">1. Overview</h2>
          <p>
            {APP_NAME} is a curated streaming platform. This Content Policy describes what kinds
            of content may be hosted and streamed on the Service, and what is expressly
            prohibited. It works alongside our Terms of Service and Copyright &amp; DMCA Notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">2. Permitted Content</h2>
          <p className="mb-2">Only the following categories of content are allowed on {APP_NAME}:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Owned content</strong> — originally produced by {APP_NAME} or commissioned
              from creators under written agreement.
            </li>
            <li>
              <strong>Licensed content</strong> — distributed under an active, written license
              from the rights holder that grants streaming rights in the relevant territories.
            </li>
            <li>
              <strong>Public-domain content</strong> — works whose copyright has expired or that
              have been explicitly released into the public domain by the rights holder.
            </li>
            <li>
              <strong>Authorized third-party content</strong> — content uploaded by verified
              rights holders (studios, distributors, or independent creators) who have signed our
              contributor agreement and confirmed their ownership.
            </li>
            <li>
              <strong>Original user-generated trailers &amp; extras</strong> — when explicitly
              submitted by the same account that owns the underlying title.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">3. Prohibited Content</h2>
          <p>The following content is strictly prohibited and will be removed on discovery:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Pirated or otherwise unauthorized copyrighted material.</li>
            <li>Content that bypasses or circumvents DRM, encryption, or other access controls.</li>
            <li>Content that infringes trademarks, patents, trade secrets, or other intellectual property.</li>
            <li>Illegal content, including child sexual abuse material (CSAM), non-consensual intimate imagery, or content that promotes terrorism.</li>
            <li>Content that incites violence, hatred, or harassment against individuals or protected groups.</li>
            <li>Malware, phishing, or content designed to compromise the platform or its users.</li>
            <li>Spam, deceptive metadata, or misleading thumbnails designed to game discovery.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">4. Content Ratings</h2>
          <p>
            Each title is rated according to its age-suitability (ALL, 7+, 13+, 16+, 18+). Kids
            profiles only see content rated ALL or 7+. We rely on self-certified ratings from
            contributors and reserve the right to adjust ratings based on internal review or user
            reports.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">5. Enforcement</h2>
          <p>
            We use automated monitoring (file hashes, metadata checks) and respond to reports
            from rights holders and users. Suspected violations are reviewed within 2 business
            days. Depending on severity, actions include content removal, account suspension,
            and referral to law enforcement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">6. Reporting a Violation</h2>
          <p>
            To report content that you believe violates this policy, email{" "}
            <a className="text-primary hover:underline" href="mailto:trust@streamverse.local">
              trust@streamverse.local
            </a>{" "}
            with the URL(s), the specific policy violation, and your contact information so we
            can follow up. For copyright-specific complaints, please use the DMCA process
            described on our Copyright page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">7. Changes to This Policy</h2>
          <p>
            We may revise this policy from time to time. Material changes will be communicated
            via email or in-app notice. Continued use after the effective date constitutes
            acceptance of the updated policy.
          </p>
        </section>
      </div>
    </article>
  );
}
