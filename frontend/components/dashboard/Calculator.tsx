"use client";

import { useState } from "react";

type Op = "+" | "-" | "*" | "/";

const OP_LABEL: Record<Op, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

// Keeps 12 digits so 0.1 + 0.2 shows 0.3
function show(n: number): string {
  return String(parseFloat(n.toPrecision(12)));
}

function apply(a: number, op: Op, b: number): number {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  return a / b;
}

const key =
  "rounded border border-slate-300 bg-gradient-to-b from-white to-slate-200 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:from-slate-50 hover:to-slate-300 focus-visible:outline-2 focus-visible:outline-[#3b82f6] active:translate-y-px";

// A simple calculator that floats over the exam screen. It does not touch the test.
export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  // The number typed before the operator, and the operator waiting for the second number
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  // true: the next digit starts a new number
  const [fresh, setFresh] = useState(true);
  const [memory, setMemory] = useState(0);
  const [folded, setFolded] = useState(false);

  const current = () => (display === "Error" ? 0 : Number(display));

  function fail() {
    setDisplay("Error");
    setExpression("");
    setAcc(null);
    setOp(null);
    setFresh(true);
  }

  function put(n: number) {
    if (!Number.isFinite(n)) return fail();
    setDisplay(show(n));
    setFresh(true);
  }

  function digit(d: string) {
    if (fresh || display === "0" || display === "Error") {
      setDisplay(d);
    } else {
      setDisplay(display + d);
    }
    setFresh(false);
  }

  function dot() {
    if (fresh || display === "Error") {
      setDisplay("0.");
      setFresh(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }

  function chooseOp(next: Op) {
    let left = current();
    if (acc !== null && op && !fresh) {
      left = apply(acc, op, left);
      if (!Number.isFinite(left)) return fail();
      setDisplay(show(left));
    }
    setAcc(left);
    setOp(next);
    setExpression(`${show(left)} ${OP_LABEL[next]}`);
    setFresh(true);
  }

  function equals() {
    if (acc === null || !op) return;
    const result = apply(acc, op, current());
    setExpression("");
    setAcc(null);
    setOp(null);
    put(result);
  }

  function clearAll() {
    setDisplay("0");
    setExpression("");
    setAcc(null);
    setOp(null);
    setFresh(true);
  }

  function back() {
    if (fresh || display === "Error") return;
    setDisplay(display.length > 1 && !(display.length === 2 && display.startsWith("-")) ? display.slice(0, -1) : "0");
  }

  function percent() {
    const value = current();
    put(acc !== null && (op === "+" || op === "-") ? (acc * value) / 100 : value / 100);
  }

  const mem = (label: string, run: () => void) => (
    <button suppressHydrationWarning type="button" onClick={run} className={key}>
      {label}
    </button>
  );
  const digitKey = (d: string, extra = "") => (
    <button suppressHydrationWarning type="button" onClick={() => digit(d)} className={`${key} ${extra}`}>
      {d}
    </button>
  );
  const opKey = (o: Op) => (
    <button suppressHydrationWarning type="button" onClick={() => chooseOp(o)} className={key} aria-label={o === "*" ? "multiply" : o === "/" ? "divide" : o === "+" ? "plus" : "minus"}>
      {OP_LABEL[o]}
    </button>
  );

  return (
    <div role="dialog" aria-label="Normal Calculator" className="fixed right-4 top-14 z-50 w-72 overflow-hidden rounded-md bg-slate-300 shadow-2xl">
      <div className="flex items-center justify-between bg-[#3b82f6] px-3 py-2.5 text-white">
        <p className="text-sm font-semibold">Normal Calculator</p>
        <div className="flex items-center gap-3">
          <button suppressHydrationWarning type="button" onClick={() => setFolded((v) => !v)} aria-label={folded ? "Expand calculator" : "Minimise calculator"} className="text-xl font-bold leading-none">
            {folded ? "▢" : "−"}
          </button>
          <button suppressHydrationWarning type="button" onClick={onClose} aria-label="Close calculator" className="text-xl font-bold leading-none">
            ×
          </button>
        </div>
      </div>

      {folded ? null : (
        <div className="space-y-2 p-3">
          <div className="h-10 truncate rounded border border-slate-300 bg-white px-2 py-2 text-right text-sm text-slate-500" aria-hidden="true">
            {expression}
          </div>
          <div role="status" aria-label="Result" className="truncate rounded border border-slate-300 bg-white px-2 py-2 text-right text-lg">
            {display}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {mem("MC", () => setMemory(0))}
            {mem("MR", () => {
              setDisplay(show(memory));
              setFresh(true);
            })}
            {mem("MS", () => setMemory(current()))}
            {mem("M+", () => setMemory(memory + current()))}
            {mem("M-", () => setMemory(memory - current()))}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            <button suppressHydrationWarning type="button" onClick={back} aria-label="Backspace" className="col-span-2 rounded bg-red-500 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-600">
              ←
            </button>
            <button suppressHydrationWarning type="button" onClick={clearAll} className="rounded bg-red-500 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-600">
              C
            </button>
            {mem("+/-", () => put(-current()))}
            {mem("√", () => put(Math.sqrt(current())))}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {digitKey("7")}
            {digitKey("8")}
            {digitKey("9")}
            {opKey("/")}
            {digitKey("4")}
            {digitKey("5")}
            {digitKey("6")}
            {opKey("*")}
            {digitKey("1")}
            {digitKey("2")}
            {digitKey("3")}
            {opKey("-")}
            <button suppressHydrationWarning type="button" onClick={percent} className={key}>
              %
            </button>
            {mem("1/x", () => put(1 / current()))}
            {digitKey("0")}
            {opKey("+")}
            <button suppressHydrationWarning type="button" onClick={dot} className={`${key} col-span-2`}>
              .
            </button>
            <button suppressHydrationWarning type="button" onClick={equals} className="col-span-2 rounded bg-emerald-500 py-2 text-lg font-bold text-white shadow-sm hover:bg-emerald-600">
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
