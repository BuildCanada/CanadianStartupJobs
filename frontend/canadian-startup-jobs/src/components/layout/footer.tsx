"use client";

import Link from "next/link";

export function Footer() {
  return (
  <footer
    data-app-footer
    className="bg-[#272727] px-5 py-8 text-neutral-300"
>
    <div className="mx-auto max-w-4xl">
    <p className="text-white">
        🏗️🇨🇦 A{" "}
        <Link href="/" className="underline decoration-white">
        Build Canada
        </Link>{" "}
        project.
    </p>
    </div>
</footer>
  );
}