"use client";

import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { PageHeader } from "@/components/common/page-header";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/form-controls";
import {
  downloadTextFile,
  importQuestionRows,
  questionTemplateCsv,
  readQuestionFile,
  type ImportResult,
  type ImportRow,
} from "@/lib/import-questions";
import { plural } from "@/lib/format";

// How many problem rows are listed on screen. The rest are counted, and fixing these shows the next ones.
const SHOWN_PROBLEMS = 200;

const COLUMN_HELP: { name: string; meaning: string; needed: string }[] = [
  { name: "subject, module, topic", meaning: "Where the question goes. Write the names exactly as they are in the admin panel.", needed: "Always" },
  { name: "question", meaning: "The question text (up to 1000 characters).", needed: "Always" },
  { name: "option_a to option_d", meaning: "The four options.", needed: "For published questions" },
  { name: "correct", meaning: "The right option: A, or A,C when two or more are right.", needed: "For published questions" },
  { name: "explanation", meaning: "What students read after answering.", needed: "For published questions" },
  { name: "difficulty", meaning: "easy, medium or hard. Empty means medium.", needed: "Optional" },
  { name: "reference", meaning: "Book or source.", needed: "Optional" },
  { name: "status", meaning: "published or draft. Empty means published. A draft needs only the question text.", needed: "Optional" },
];

// Bulk import: choose a CSV or Excel file, check it, then import the good rows
export function QuestionImport() {
  const { subjects, modules, topics, reloadContent } = useAdminStore();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileError, setFileError] = useState("");
  const [createMissing, setCreateMissing] = useState(false);
  const [checked, setChecked] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<"reading" | "checking" | "importing" | null>(null);
  const [serverError, setServerError] = useState("");

  // The template shows a real subject, module and topic of this panel, so the example works as it is
  function downloadTemplate() {
    const subject = subjects.items[0];
    const firstModule = subject ? modules.items.find((m) => m.subjectId === subject.id) : undefined;
    const topic = firstModule ? topics.items.find((t) => t.moduleId === firstModule.id) : undefined;
    downloadTextFile(
      "question-import-template.csv",
      questionTemplateCsv({ subject: subject?.name ?? "Anatomy", module: firstModule?.name ?? "Limbs", topic: topic?.name ?? "Upper Limb" }),
    );
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setChecked(null);
    setDone(null);
    setServerError("");
    if (!file) return;

    setBusy("reading");
    const result = await readQuestionFile(file);
    setBusy(null);
    setFileName(file.name);
    if (result.ok) {
      setRows(result.rows);
      setFileError("");
    } else {
      setRows(null);
      setFileError(result.message);
    }
  }

  async function run(dryRun: boolean) {
    if (!rows) return;
    setServerError("");
    setBusy(dryRun ? "checking" : "importing");
    const result = await importQuestionRows(rows, { createMissing, dryRun });
    setBusy(null);
    if (!result.ok) return setServerError(result.message);

    if (dryRun) {
      setChecked(result.data);
      return;
    }
    // The new questions (and any new modules and topics) are now in the database: load them into the panel
    reloadContent();
    setDone(result.data);
    setChecked(null);
    toast({ title: "Questions imported", description: `${plural(result.data.imported, "question")} added to the question bank.` });
  }

  function startOver() {
    setRows(null);
    setFileName("");
    setChecked(null);
    setDone(null);
    setServerError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  const problems = checked?.problems ?? [];

  return (
    <>
      <Link href="/questions" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to question bank
      </Link>
      <PageHeader
        title="Import questions"
        description="Add many questions at once from a CSV or Excel file. Check the file first: nothing is saved until you press Import."
      />

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader title="1. Get the template" description="One row is one question. The first row holds the column names." />
          <CardContent className="space-y-4">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={downloadTemplate}>
              Download template (CSV)
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <caption className="sr-only">The columns of the file</caption>
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th scope="col" className="py-2 pr-4 font-semibold">Column</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">What to write</th>
                    <th scope="col" className="py-2 font-semibold">Needed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COLUMN_HELP.map((column) => (
                    <tr key={column.name}>
                      <td className="py-2 pr-4 font-medium text-slate-800">{column.name}</td>
                      <td className="py-2 pr-4 text-slate-600">{column.meaning}</td>
                      <td className="py-2 text-slate-500">{column.needed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">An Excel file (.xlsx) works too: use the same column names in its first sheet. Up to 2000 questions and 5 MB per file.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="2. Choose your file" />
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.xlsx"
                onChange={(event) => void onFile(event)}
                aria-label="Choose a CSV or Excel file"
                className="block w-full max-w-md cursor-pointer text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {busy === "reading" ? <span role="status" className="text-sm text-slate-500">Reading the file…</span> : null}
            </div>

            {fileError ? (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {fileError}
              </p>
            ) : null}

            {rows ? (
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <FileSpreadsheet className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <strong>{fileName}</strong>: {plural(rows.length, "question row")} found.
              </p>
            ) : null}

            <Checkbox
              label="Create missing modules and topics"
              description="Off: a row whose module or topic does not exist is reported as a problem. On: they are created for you. Subjects are never created by the import."
              checked={createMissing}
              onChange={(event) => {
                setCreateMissing(event.target.checked);
                // The result of the last check was made with the old setting
                setChecked(null);
              }}
            />

            <Button onClick={() => void run(true)} disabled={!rows || busy !== null} loading={busy === "checking"}>
              Check file
            </Button>
          </CardContent>
        </Card>

        {serverError ? (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {serverError}
          </p>
        ) : null}

        {checked ? (
          <Card>
            <CardHeader title="3. Result of the check" description="Nothing has been saved yet." />
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {plural(checked.valid, "question")} ready to import
                </span>
                {problems.length > 0 ? (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-700">
                    <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                    {plural(problems.length, "row")} will be skipped
                  </span>
                ) : null}
              </div>

              {checked.created.modules + checked.created.topics > 0 ? (
                <p className="text-sm text-slate-600">
                  This will also create {plural(checked.created.modules, "new module")} and {plural(checked.created.topics, "new topic")}.
                </p>
              ) : null}

              {problems.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Rows with a problem (the row number is the one in your spreadsheet)</p>
                  <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Rows that will be skipped</caption>
                      <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th scope="col" className="w-20 px-3 py-2 font-semibold">Row</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Problem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {problems.slice(0, SHOWN_PROBLEMS).map((problem) => (
                          <tr key={`${problem.row}-${problem.message}`}>
                            <td className="px-3 py-2 font-medium text-slate-800">{problem.row}</td>
                            <td className="px-3 py-2 text-slate-600">{problem.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {problems.length > SHOWN_PROBLEMS ? (
                    <p className="mt-2 text-xs text-slate-500">…and {plural(problems.length - SHOWN_PROBLEMS, "more row")}. Fix these and check the file again to see them.</p>
                  ) : null}
                </div>
              ) : null}

              {checked.valid > 0 ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  <Button onClick={() => void run(false)} disabled={busy !== null} loading={busy === "importing"}>
                    Import {plural(checked.valid, "question")}
                  </Button>
                  {problems.length > 0 ? <span className="text-sm text-slate-500">The skipped rows are not imported. You can fix them and import the file again: questions already added are skipped.</span> : null}
                </div>
              ) : (
                <p className="border-t border-slate-100 pt-4 text-sm text-slate-600">No row can be imported yet. Fix the problems above in your file, choose it again and check again.</p>
              )}
            </CardContent>
          </Card>
        ) : null}

        {done ? (
          <Card>
            <CardContent className="space-y-4">
              <p className="flex items-center gap-2 text-base font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                {plural(done.imported, "question")} imported
              </p>
              {done.created.modules + done.created.topics > 0 ? (
                <p className="text-sm text-slate-600">
                  {plural(done.created.modules, "new module")} and {plural(done.created.topics, "new topic")} were created. You can find them on the page of their subject (Subjects, then the eye button).
                </p>
              ) : null}
              {done.problems.length > 0 ? <p className="text-sm text-slate-600">{plural(done.problems.length, "row")} were skipped.</p> : null}
              <div className="flex flex-wrap gap-2">
                <Link href="/questions" className={buttonStyles()}>
                  View question bank
                </Link>
                <Button variant="outline" onClick={startOver}>
                  Import another file
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
