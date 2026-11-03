import { DocIcon } from "./icons";
import { paletteLegend } from "@/data/testInstructions";
import type { InstructionGroup, RichText } from "@/types/dashboard";

function Rich({ value }: { value: RichText }) {
  if (typeof value === "string") return <>{value}</>;
  return (
    <>
      {value.map((part, i) =>
        part.bold ? (
          <strong key={i} className="font-semibold">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function PaletteLegend() {
  return (
    <ul className="mt-3 space-y-2.5">
      {paletteLegend.map((entry) => (
        <li key={entry.label} className="flex items-center gap-3">
          <span
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-medium text-white/80 ${entry.className}`}
            aria-hidden="true"
          >
            1
            {entry.badge ? (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[#6b3fa0] shadow-sm">
                <DocIcon className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </span>
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}

// Numbered instruction lists. The numbers continue across groups via `start`.
export default function InstructionBlocks({ groups }: { groups: InstructionGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.heading} className="mt-4 first:mt-0">
          <h3 className="text-xs font-semibold underline">{group.heading}</h3>
          <ol start={group.start} className="mt-2 list-decimal space-y-2 pl-6 text-xs marker:text-[10px]">
            {group.items.map((item, i) => (
              <li key={i} className={`pl-1 ${item.bold ? "font-semibold" : ""}`}>
                <Rich value={item.text} />
                {item.palette ? <PaletteLegend /> : null}
                {item.bullets ? (
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 font-normal marker:text-[10px]">
                    {item.bullets.map((bullet, j) => (
                      <li key={j}>
                        <Rich value={bullet} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}
