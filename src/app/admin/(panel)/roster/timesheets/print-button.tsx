"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary min-h-10 px-4 text-sm">
      Print for signature
    </button>
  );
}
