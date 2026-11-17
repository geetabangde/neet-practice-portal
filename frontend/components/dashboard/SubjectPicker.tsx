import Image from "next/image";
import { subjectLook } from "@/lib/subjectLook";
import type { PickerSubject } from "@/lib/studentContent";
import { DocIcon } from "./icons";

type SubjectPickerProps = {
  subjects: PickerSubject[];
  // Subject id -> ids of the modules that are ticked in it. A subject that is not here is not chosen.
  selected: Record<number, number[]>;
  onToggleSubject: (subject: PickerSubject) => void;
  onToggleModule: (subject: PickerSubject, moduleId: number) => void;
};

// A subject has its picture when one was designed for it, otherwise a letter badge
function SubjectPicture({ icon, name, size }: { icon: string | null; name: string; size: "large" | "small" }) {
  const box = size === "large" ? "h-10 w-10" : "h-8 w-8";
  return icon ? (
    <Image src={`/subjects/${icon}.png`} alt="" width={60} height={60} className={`${box} shrink-0 object-contain`} />
  ) : (
    <span aria-hidden="true" className={`${box} flex shrink-0 items-center justify-center rounded-full bg-white/70 text-base font-bold text-accent-dark`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function SubjectPicker({ subjects, selected, onToggleSubject, onToggleModule }: SubjectPickerProps) {
  // Two columns, filled one subject at a time from left to right
  const columns = [subjects.filter((_, index) => index % 2 === 0), subjects.filter((_, index) => index % 2 === 1)];

  return (
    <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="space-y-3">
          {column.map((subject) => {
            const look = subjectLook(subject.slug, subject.id);
            const ticked = selected[subject.id];
            const isSelected = ticked !== undefined;
            const hasModules = subject.modules.length > 0;

            return (
              <div key={subject.id} className={`rounded-xl p-4 ${look.toneClass}`}>
                <label className={`flex items-center gap-4 ${hasModules ? "cursor-pointer" : "opacity-70"}`}>
                  <SubjectPicture icon={look.icon} name={subject.name} size="large" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold">{subject.name}</span>
                    {!hasModules ? <span className="block text-[11px] text-slate-700">No modules yet</span> : null}
                  </span>
                  <input
                    suppressHydrationWarning
                    type="checkbox"
                    checked={isSelected}
                    disabled={!hasModules}
                    onChange={() => onToggleSubject(subject)}
                    aria-label={`Choose ${subject.name}`}
                    className="h-4 w-4 accent-accent"
                  />
                </label>

                {isSelected && hasModules ? (
                  <ul
                    aria-label={`${subject.name} modules`}
                    className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-3 [scrollbar-color:var(--color-accent)_rgba(0,0,0,0.06)] [scrollbar-width:thin]"
                  >
                    {subject.modules.map((module) => (
                      <li key={module.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-1.5 pr-3">
                          <input
                            suppressHydrationWarning
                            type="checkbox"
                            checked={ticked.includes(module.id)}
                            onChange={() => onToggleModule(subject, module.id)}
                            className="h-3.5 w-3.5 shrink-0 accent-accent"
                          />
                          <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md bg-accent-soft">
                            <SubjectPicture icon={look.icon} name={subject.name} size="small" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{module.name}</span>
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-700">
                              <DocIcon className="h-3.5 w-3.5" />
                              {module.questionCount} MCQs
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
