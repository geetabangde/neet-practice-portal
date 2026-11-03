type SectionHeadingProps = {
  badge: string;
  title: string;
  highlight: string;
  subtitle?: string;
  dark?: boolean;
  id?: string;
  // Use "h1" when the heading is the title of a whole page
  as?: "h1" | "h2";
};

// Renders: [badge pill] Title <cyan highlight>
export default function SectionHeading({
  badge,
  title,
  highlight,
  subtitle,
  dark = false,
  id,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span
        className={`inline-block rounded-full px-3 py-1 text-xl font-medium ${dark ? "bg-accent/20 text-white" : "bg-accent-soft text-accent-dark"}`}
      >
        {badge}
      </span>
      <Tag
        id={id}
        className={`mt-4 text-3xl font-bold tracking-tight sm:text-3xl ${dark ? "text-white" : "text-black"}`}
      >
        {title} <span className="text-accent">{highlight}</span>
      </Tag>
      {subtitle ? (
        <p className={`mt-3 text-sm ${dark ? "text-white/60" : "text-slate-500"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
