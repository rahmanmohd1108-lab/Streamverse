import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_NAME} collects, uses, and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12 max-w-3xl prose prose-invert">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">1. Introduction</h2>
          <p>
            {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;the platform&rdquo;) respects your
            privacy. This Privacy Policy explains what information we collect when you use our
            website and services, how we use it, and the choices you have. By using {APP_NAME},
            you agree to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">2. Information We Collect</h2>
          <p className="mb-2">We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Account information</strong>: name, email address, and password (stored as
              a salted hash). Email is used for sign-in, password resets, and account
              notifications.
            </li>
            <li>
              <strong>Profile information</strong>: profile names, avatars, language preference,
              and maturity level you create (up to 5 profiles per account).
            </li>
            <li>
              <strong>Usage information</strong>: titles you watch, your position in each video,
              items on your watchlist, ratings you submit, and search queries you enter. This
              powers features like Continue Watching and recommendations.
            </li>
            <li>
              <strong>Device and technical information</strong>: browser type, IP address,
              approximate location (country/city), and platform. We use this for security,
              fraud prevention, and to ensure compatible video quality for your connection.
            </li>
            <li>
              <strong>Payment information</strong>: when you subscribe to a paid plan, your
              payment is processed by our payment provider. We do not store full card numbers on
              our servers; only the last four digits and a tokenized reference are kept.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">3. How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide, operate, and improve the {APP_NAME} service.</li>
            <li>To personalize content recommendations and remember your watch position.</li>
            <li>To communicate with you about your account, subscription, and new content.</li>
            <li>To detect, prevent, and respond to fraud, abuse, and security issues.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">4. Legal Basis (GDPR)</h2>
          <p>
            Where we process personal data of users in the European Economic Area and the UK, we
            rely on the following legal bases: (a) performance of a contract (providing the
            service you signed up for), (b) our legitimate interests (security, fraud
            prevention, service improvement), and (c) your consent (marketing communications),
            which you may withdraw at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">5. Cookies & Local Storage</h2>
          <p>
            We use httpOnly cookies to maintain your authenticated session. We use browser local
            storage to remember UI preferences (such as muted state on the video player). We do
            not use third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">6. Data Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with: (a) service
            providers who help us run the platform (e.g. payment processors, CDN, email
            delivery), (b) authorities when required by law, and (c) successors in the event of
            a merger, acquisition, or asset sale. All such recipients are bound by confidentiality
            obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">7. Data Retention</h2>
          <p>
            We retain account information for as long as your account is active. Watch history,
            watchlist, and ratings are kept until you delete them or your account. Anonymized,
            aggregated analytics may be kept indefinitely.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">8. Your Rights</h2>
          <p>
            Subject to your jurisdiction, you may have the right to access, correct, export, or
            delete your personal data; object to or restrict processing; and withdraw consent.
            To exercise any of these rights, contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">9. Children</h2>
          <p>
            {APP_NAME} is not directed at children under 13 (or the equivalent minimum age in
            your country). Parents may set up a Kids profile within an existing account to
            restrict visible content to titles rated ALL or 7+.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">10. Security</h2>
          <p>
            We use industry-standard measures including TLS in transit, hashed passwords
            (bcrypt), httpOnly secure cookies, and least-privilege access controls. No method of
            transmission or storage is 100% secure; we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">11. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. We will notify you of material changes
            via the email on file or a banner on the site. Continued use after the effective date
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">12. Contact</h2>
          <p>
            Questions about this policy or your data? Email{" "}
            <a className="text-primary hover:underline" href="mailto:privacy@streamverse.local">
              privacy@streamverse.local
            </a>{" "}
            or write to us at the address listed on the Contact page.
          </p>
        </section>
      </div>
    </article>
  );
}
