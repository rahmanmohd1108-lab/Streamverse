import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Copyright & DMCA",
  description: `Copyright policy and DMCA takedown procedure for ${APP_NAME}.`,
  alternates: { canonical: "/copyright" },
};

export default function CopyrightPage() {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 pb-20 md:pb-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
        Copyright &amp; DMCA Notice
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">1. Our Commitment</h2>
          <p>
            {APP_NAME} respects the intellectual property rights of others and expects users of
            the platform to do the same. We only host and stream content that we own, that we
            have properly licensed from rights holders, or that is in the public domain.
            Pirated or otherwise unauthorized copyrighted material is strictly prohibited on our
            platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">2. Content Sourcing</h2>
          <p className="mb-2">Every title on {APP_NAME} falls into one of these categories:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Owned</strong> — produced by or for {APP_NAME}.</li>
            <li><strong>Licensed</strong> — distributed under a written license from the rights holder.</li>
            <li><strong>Public domain</strong> — works whose copyright has expired or that were released to the public domain.</li>
            <li><strong>Authorized third-party</strong> — content contributed by verified rightsholders under our content policy.</li>
          </ul>
          <p className="mt-2">
            The development build of {APP_NAME} uses freely-redistributable test streams (such as
            <em> Big Buck Bunny</em> and <em>Sintel</em>) from the Mux test collection and the
            Google sample CDN. No third-party copyrighted material is hosted without an explicit
            license.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">3. DMCA Takedown Procedure</h2>
          <p>
            If you believe that content on {APP_NAME} infringes your copyright, you (or your
            authorized agent) may submit a takedown request. To be effective under the Digital
            Millennium Copyright Act (DMCA) and analogous international laws, your notice must
            include:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>A physical or electronic signature of the rights holder or authorized agent.</li>
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material on {APP_NAME} that is claimed to be infringing, including the URL(s).</li>
            <li>Your contact information (name, address, email, phone).</li>
            <li>A statement that you have a good-faith belief that the use is not authorized.</li>
            <li>A statement, under penalty of perjury, that the information is accurate and that you are the rights holder or authorized to act on their behalf.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">4. Where to Send Notices</h2>
          <p>
            Send your takedown notice to our designated copyright agent:
          </p>
          <div className="mt-3 rounded-md border border-border/60 bg-card/60 p-4">
            <p className="font-semibold">{APP_NAME} — Copyright Agent</p>
            <p className="mt-1">Email: <a className="text-primary hover:underline" href="mailto:dmca@streamverse.local">dmca@streamverse.local</a></p>
            <p className="text-xs text-muted-foreground mt-2">
              We aim to review and respond to notices within 2 business days of receipt. Repeat
              infringers will have their accounts terminated.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">5. Counter-Notice</h2>
          <p>
            If you believe that your content was removed in error, you may submit a
            counter-notice with similar formalities. We will share the counter-notice with the
            original complainant and may restore the content within 10–14 business days unless we
            receive notice that the complainant has filed a court action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">6. Repeat Infringer Policy</h2>
          <p>
            We will terminate, in appropriate circumstances, the accounts of users who are
            determined to be repeat infringers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">7. Contact</h2>
          <p>
            Questions about this policy can be sent to{" "}
            <a className="text-primary hover:underline" href="mailto:dmca@streamverse.local">
              dmca@streamverse.local
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
