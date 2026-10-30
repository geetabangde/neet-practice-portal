import Image from "next/image";
import { customModuleColumns, customSubjectModules, dashboardSubjects } from "@/data/dashboard";
import { DocIcon } from "./icons";

type SubjectPickerProps = {
  // Selected subject slug -> titles of its selected modules
  selected: Record<string, string[]>;
  onToggleSubject: (slug: string) => void;
  onToggleModule: (slug: string, title: string) => void;
};

export default function SubjectPicker({ selected, onToggleSubject, onToggleModule }: SubjectPickerProps) {
  return (
    <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
      {customModuleColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="space-y-3">
          {column.map((slug) => {
            const subject = dashboardSubjects.find((s) => s.slug === slug);
            if (!subject) return null;
            const isSelected = slug in selected;
            const modules = customSubjectModules[slug];

            return (
              <div key={slug} className={`rounded-xl p-4 ${subject.toneClass}`}>
                <label className="flex cursor-pointer items-center gap-4">
                  <Image
                    src={`/subjects/${subject.icon}.png`}
                    alt=""
                    width={60}
                    height={60}
                    className="h-10 w-10 shrink-0 object-contain"
                  />
                  <span className="flex-1 text-base font-semibold">{subject.name}</span>
                  <input
                    suppressHydrationWarning
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSubject(slug)}
                    className="h-4 w-4 accent-accent"
                  />
                </label>

                {isSelected && modules ? (
                  <ul
                    aria-label={`${subject.name} modules`}
                    className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-3 [scrollbar-color:var(--color-accent)_rgba(0,0,0,0.06)] [scrollbar-width:thin]"
                  >
                    {modules.map((module) => (
                      <li key={module.title}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-1.5 pr-3">
                          <input
                            suppressHydrationWarning
                            type="checkbox"
                            checked={selected[slug].includes(module.title)}
                            onChange={() => onToggleModule(slug, module.title)}
                            className="h-3.5 w-3.5 shrink-0 accent-accent"
                          />
                          <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md bg-accent-soft">
                            <Image
                              src={`/subjects/${subject.icon}.png`}
                              alt=""
                              width={40}
                              height={40}
                              className="h-8 w-8 object-contain"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{module.title}</span>
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-700">
                              <DocIcon className="h-3.5 w-3.5" />
                              {module.count} Module
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
