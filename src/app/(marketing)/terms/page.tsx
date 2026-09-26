import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms and conditions under which ${APP_NAME} provides its streaming services.`,
};

export default function TermsPage() {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12 max-w-3xl prose prose-invert">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the {APP_NAME}
            (&ldquo;the Service&rdquo;) website, applications, and content. By creating an account or
            using the Service in any way, you agree to be bound by these Terms. If you do not
            agree, you may not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">2. Eligibility</h2>
          <p>
            You must be at least 13 years of age (or the minimum age required for parental consent
            in your country) to create an account. By registering, you represent that you meet this
            requirement and that the information you provide is accurate and complete.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">3. Your Account</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You are responsible for safeguarding your password and for all activity under your account.</li>
            <li>You may create up to 5 profiles per account. Profiles do not have separate credentials.</li>
            <li>You may not share your account outside your household beyond the limits set by your subscription plan (1, 2, or 4 simultaneous streams).</li>
            <li>You must promptly notify us of any unauthorized use or security breach.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">4. Content &amp; Licenses</h2>
          <p>
            All content available on the Service is either owned by {APP_NAME}, properly licensed
            from rights holders, or in the public domain. You may stream content solely for
            personal, non-commercial viewing. You may not download, copy, redistribute, modify,
            publicly perform, or sell content unless explicitly authorized by these Terms or by the
            relevant rights holder.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">5. Acceptable Use</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You will not attempt to bypass DRM, encryption, or other access controls.</li>
            <li>You will not reverse-engineer, scrape, or otherwise extract data from the Service.</li>
            <li>You will not upload, transmit, or distribute unauthorized copyrighted or illegal content.</li>
            <li>You will not interfere with the proper functioning of the Service or attempt to gain unauthorized access to our systems.</li>
            <li>You will not use automated systems (bots, crawlers) without our prior written permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">6. Subscription &amp; Billing</h2>
          <p>
            Paid plans are billed in advance on a recurring monthly or annual basis. You authorize
            us to charge the recurring fee to your designated payment method until you cancel.
            Cancellations take effect at the end of the current billing period; no refunds are
            provided for partial periods. Pricing and features may change with reasonable advance
            notice; existing subscribers are grandfathered at their current rate through the end
            of their current term.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">7. Free Trial &amp; Promotions</h2>
          <p>
            From time to time we may offer free trials or promotional pricing. Eligibility,
            duration, and conversion to a paid plan will be communicated at the time of the offer.
            We may limit free trials to one per user or device.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">8. Intellectual Property</h2>
          <p>
            The {APP_NAME} name, logo, software, design, and original written content are the
            property of {APP_NAME} and protected by applicable intellectual property laws. Third
            party trademarks, service marks, and content belong to their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">9. Disclaimer</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, including implied warranties of
            merchantability, fitness for a particular purpose, title, or non-infringement. We do
            not warrant that the Service will be uninterrupted, error-free, or free of harmful
            components.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, {APP_NAME} and its affiliates shall not be
            liable for indirect, incidental, special, consequential, or punitive damages, or for
            any loss of profits or revenues, arising from your use of or inability to use the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless {APP_NAME} and its affiliates from any claim,
            demand, or damage (including reasonable attorneys&apos; fees) arising from your
            violation of these Terms or your misuse of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">12. Termination</h2>
          <p>
            You may stop using the Service at any time. We may suspend or terminate your access if
            you violate these Terms, if your account is inactive for an extended period, or to
            protect the Service or its users. Upon termination, all licenses granted to you cease
            immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">13. Changes to These Terms</h2>
          <p>
            We may revise these Terms periodically. We will post the updated version on this page
            with a new &ldquo;Last updated&rdquo; date. Material changes will be communicated via
            email or in-app notice. Continued use after the effective date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">14. Governing Law &amp; Disputes</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which {APP_NAME} is
            incorporated, without regard to conflict-of-laws principles. Any disputes will be
            resolved exclusively in the courts of that jurisdiction, except where prohibited by
            local consumer protection laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">15. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
            <a className="text-primary hover:underline" href="mailto:legal@streamverse.local">
              legal@streamverse.local
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
