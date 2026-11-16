interface Props {
  pre: string;
  em: string;
  post?: string;
  className?: string;
}

/** Section title set solid. The heading carries the section on its own: no kicker above it. */
export function SectionHeading({ pre, em, post, className = "" }: Props) {
  return (
    <h2 className={`m-0 max-w-[20ch] text-4xl font-black leading-solid ${className}`}>
      {pre} {em}
      {post ? ` ${post}` : "."}
    </h2>
  );
}
