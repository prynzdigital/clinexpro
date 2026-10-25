/** Red asterisk after a required field's label. Screen readers get "required" from the input itself. */
export function Req() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden="true">
      *
    </span>
  );
}

/** "Fields marked * are required." note shown at the top of a form. */
export function RequiredNote({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`text-sm text-ink-soft ${className}`}>
      <span className="text-danger" aria-hidden="true">*</span> {text}
    </p>
  );
}
