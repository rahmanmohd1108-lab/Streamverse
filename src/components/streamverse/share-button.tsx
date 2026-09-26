"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** path or full URL to share. If relative, will be resolved against window.location.origin */
  path?: string;
  title?: string;
  className?: string;
  variant?: "button" | "icon" | "dropdown";
  label?: string;
}

/**
 * Copy-to-clipboard share button.
 *
 * Uses navigator.clipboard when available, with a graceful fallback
 * to a hidden textarea + execCommand("copy") for older browsers.
 */
export function ShareButton({
  path,
  title,
  className,
  variant = "button",
  label = "Share",
}: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    if (!path) {
      return typeof window !== "undefined" ? window.location.href : "";
    }
    if (path.startsWith("http")) return path;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const copy = async () => {
    const url = buildUrl();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback: hidden textarea + execCommand
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast({ title: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Couldn't copy link",
        description: "Copy this URL manually: " + url,
        variant: "destructive",
      });
    }
  };

  const shareNative = async () => {
    const url = buildUrl();
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: title || "Share",
          url,
        });
      } catch {
        // user dismissed — no toast
      }
    } else {
      copy();
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="secondary"
        size="icon"
        className={cn("bg-white/10 backdrop-blur", className)}
        onClick={copy}
        aria-label="Share"
        title="Share"
      >
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      </Button>
    );
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className={cn("bg-white/10 backdrop-blur", className)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={copy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareNative}>
            <Share2 className="h-4 w-4 mr-2" />
            Share via…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="secondary"
      className={cn("bg-white/10 backdrop-blur", className)}
      onClick={copy}
    >
      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
