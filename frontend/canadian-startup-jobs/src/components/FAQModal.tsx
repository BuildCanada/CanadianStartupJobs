"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BACKGROUND, BLACK } from "@/utils/constants";

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent
        className="sm:max-w-2xl border border-neutral-300 shadow-2xl"
        style={{ backgroundColor: BACKGROUND, color: BLACK }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Frequently Asked Questions
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 text-sm leading-relaxed">
          <div>
            <h3 className="text-base font-semibold mb-2">
              What is Canadian Startup Jobs?
            </h3>
            <p className="text-black/80">
              A focused board showcasing roles at Canadian‑owned and operated
              startups. We combine community submissions with responsibly sourced
              public listings into one unified feed.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">
              How do you define a Canadian startup?
            </h3>
            <p className="text-black/80">
              Companies founded in Canada with an active product or service
              presence here. We flag Verified 🇨🇦 once we complete an ownership /
              presence check against business registries.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">
              What data does each job show?
            </h3>
            <p className="text-black/80">
              Title, company, location / province, remote flag, employment type,
              posted date, tags, source, and apply method.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">
              How will search & filters work?
            </h3>
            <p className="text-black/80">
              Filter by keyword, company, province, remote, job type, and category
              (coming soon).
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">
              Can I apply directly on the site?
            </h3>
            <p className="text-black/80">
              Internal roles use an on‑site form; external roles link out and are
              labeled clearly.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">How do I post a job?</h3>
            <p className="text-black/80">
              Company dashboard coming soon. For now email{" "}
              <a
                href="mailto:hi@buildcanada.com"
                className="underline underline-offset-2 decoration-[#8b2332] hover:text-[#8b2332]"
              >
                hi@buildcanada.com
              </a>{" "}
              with role details.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">
              How can I help or contribute?
            </h3>
            <p className="text-black/80">
              Contribute on{" "}
              <a
                href="https://github.com/BuildCanada"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 decoration-[#8b2332] hover:text-[#8b2332]"
              >
                GitHub
              </a>{" "}
              or join our{" "}
              <a
                href="https://discord.gg/VmbBSXKMve"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 decoration-[#8b2332] hover:text-[#8b2332]"
              >
                Discord
              </a>
              .
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">How do I contact you?</h3>
            <p className="text-black/80">
              Email{" "}
              <a
                href="mailto:hi@buildcanada.com"
                className="underline underline-offset-2 decoration-[#8b2332] hover:text-[#8b2332]"
              >
                hi@buildcanada.com
              </a>{" "}
              with partnership or posting questions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}