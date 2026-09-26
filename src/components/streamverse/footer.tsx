"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const FOOTER_LINKS = [
  {
    title: "Browse",
    links: [
      { label: "Home", href: "/" },
      { label: "Movies", href: "/movies" },
      { label: "Series", href: "/series" },
      { label: "My List", href: "/my-list" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Content Policy", href: "/content-policy" },
      { label: "Copyright / DMCA", href: "/dmca" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Sign up", href: "/register" },
      { label: "Subscription", href: "/subscription" },
      { label: "Help Center", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card/40">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Link href="/" className="text-2xl font-black text-primary">
              {APP_NAME.toUpperCase()}
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              A modern OTT streaming platform built for premium movies and series
              across multiple languages. Stream anytime, anywhere, on any device.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
              StreamVerse is a demo platform using only public-domain or properly
              licensed test content.
            </p>
          </div>
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-sm mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
