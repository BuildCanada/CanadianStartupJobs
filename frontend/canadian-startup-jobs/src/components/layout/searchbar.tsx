"use client";

import { ChangeEvent } from "react";

type SearchBarProps = {
  value: string;
  onChange: (next: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value);

  return (
    <label className="block">
      <span className="sr-only">Search jobs</span>
      <input
        type="search"
        value={value}
        onChange={handleInput}
        placeholder="Search roles, companies, or keywords"
        className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
      />
    </label>
  );
}
