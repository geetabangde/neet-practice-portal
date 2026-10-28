type SectionHeadingProps = {
  badge: string;
  title: string;
  highlight: string;
  subtitle?: string;
  dark?: boolean;
  id?: string;
};

// Renders: [badge pill] Title <cyan highlight>
export default function SectionHeading({
  badge,
  title,
  highlight,
  subtitle,
  dark = false,
  id,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark">
        {badge}
      </span>
      <h2
        id={id}
        className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-brand-950"}`}
      >
        {title} <span className="text-accent">{highlight}</span>
      </h2>
      {subtitle ? (
        <p className={`mt-3 text-sm ${dark ? "text-white/60" : "text-slate-500"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
