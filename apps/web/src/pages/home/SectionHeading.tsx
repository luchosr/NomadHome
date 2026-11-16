interface Props {
  eyebrow: string;
  pre: string;
  em: string;
  post?: string;
}

export function SectionHeading({ eyebrow, pre, em, post }: Props) {
  return (
    <>
      <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-fg-subtle">
        {eyebrow}
      </p>
      <h2 className="m-0 font-display text-4xl font-normal leading-tight tracking-tight text-fg md:text-5xl">
        {pre} <em className="not-italic text-fg">{em}</em>
        {post ? ` ${post}` : "."}
      </h2>
    </>
  );
}
