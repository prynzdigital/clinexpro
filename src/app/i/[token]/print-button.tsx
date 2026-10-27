"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary min-h-10 text-sm">
      {label}
    </button>
  );
}
