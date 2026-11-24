import { strToU8, unzipSync, zipSync } from "fflate";
import { uploadQuestionImage } from "@/lib/images-api";

// A file of questions can name a picture for each question (an "image" column holding a file name like xray.png).
// A spreadsheet cannot hold the pictures themselves, so they come with it: inside a .zip together with the spreadsheet,
// or chosen next to it. These helpers open such a bundle, send the pictures to the server, and make the sample zip.

const PICTURE_TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export const MAX_PICTURE_BYTES = 2 * 1024 * 1024;
const MAX_ZIP_BYTES = 25 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 700;

const extensionOf = (name: string) => (name.toLowerCase().split(".").pop() ?? "").trim();
const baseName = (path: string) => path.split(/[\\/]/).pop() ?? path;

export const isPictureName = (name: string) => extensionOf(name) in PICTURE_TYPES;

// How a picture is looked up: by its file name alone, in lower case ("Photos/XRay.PNG" is "xray.png")
export const pictureKey = (name: string) => baseName(name).trim().toLowerCase();

export type Bundle = { ok: true; sheet: File; pictures: Map<string, File> } | { ok: false; message: string };

function toFile(bytes: Uint8Array, name: string, type: string): File {
  return new File([bytes.slice() as BlobPart], name, { type });
}

// Opens what the admin chose: a spreadsheet (.csv or .xlsx), or a .zip with the spreadsheet and the pictures inside.
// Pictures chosen separately are added (they win over a picture of the same name inside the zip).
export async function openBundle(main: File, chosenPictures: File[]): Promise<Bundle> {
  const pictures = new Map<string, File>();

  let sheet: File | null = null;
  if (extensionOf(main.name) === "zip") {
    if (main.size > MAX_ZIP_BYTES) return { ok: false, message: "The zip file is bigger than 25 MB." };
    let entries: Record<string, Uint8Array>;
    try {
      let count = 0;
      entries = unzipSync(new Uint8Array(await main.arrayBuffer()), {
        // Skip folders, the junk a Mac adds, and any single file that unpacks to more than 12 MB (a zip bomb)
        filter: (file) => {
          if (file.name.endsWith("/") || file.name.startsWith("__MACOSX/") || baseName(file.name).startsWith(".")) return false;
          count += 1;
          return count <= MAX_ZIP_ENTRIES && file.originalSize <= 12 * 1024 * 1024;
        },
      });
    } catch {
      return { ok: false, message: "The zip file could not be opened. Check that it is a normal .zip file." };
    }
    const names = Object.keys(entries);
    // The spreadsheet: a .csv or .xlsx, the one nearest to the top of the zip
    const sheets = names.filter((name) => ["csv", "xlsx"].includes(extensionOf(name))).sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
    if (sheets.length === 0) return { ok: false, message: "The zip file has no .csv or .xlsx file inside it." };
    sheet = toFile(entries[sheets[0]], baseName(sheets[0]), extensionOf(sheets[0]) === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    for (const name of names) {
      if (!isPictureName(name)) continue;
      pictures.set(pictureKey(name), toFile(entries[name], baseName(name), PICTURE_TYPES[extensionOf(name)]));
    }
  } else {
    sheet = main;
  }

  for (const file of chosenPictures) if (isPictureName(file.name)) pictures.set(pictureKey(file.name), file);
  return { ok: true, sheet, pictures };
}

export type UploadOutcome = { ok: true; tokens: Map<string, string> } | { ok: false; message: string };

// Sends each picture the questions use to the server (once, even when several questions use it). Gives back token by picture key.
export async function uploadPictures(keys: string[], pictures: Map<string, File>, onProgress: (done: number, total: number) => void): Promise<UploadOutcome> {
  const unique = [...new Set(keys)];
  const tokens = new Map<string, string>();
  for (const [index, key] of unique.entries()) {
    const file = pictures.get(key);
    if (!file) return { ok: false, message: `The picture "${key}" was not found.` };
    if (file.size > MAX_PICTURE_BYTES) return { ok: false, message: `The picture "${key}" is bigger than 2 MB.` };
    onProgress(index, unique.length);
    const result = await uploadQuestionImage(file);
    if (!result.ok) return { ok: false, message: `The picture "${key}" was not uploaded: ${result.message}` };
    tokens.set(key, result.data.token);
  }
  onProgress(unique.length, unique.length);
  return { ok: true, tokens };
}

// A small drawn picture for the sample zip (a curve on a grid, with a label)
async function samplePicture(label: string, color: string, bend: number): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 270;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("no canvas");
  g.fillStyle = "#f7fcfd";
  g.fillRect(0, 0, 480, 270);
  g.fillStyle = color;
  g.fillRect(0, 0, 480, 6);
  g.strokeStyle = "#dce8ec";
  g.lineWidth = 1;
  for (let k = 0; k <= 4; k++) {
    g.beginPath();
    g.moveTo(50, 40 + k * 45);
    g.lineTo(450, 40 + k * 45);
    g.stroke();
  }
  g.strokeStyle = "#1e293b";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(50, 30);
  g.lineTo(50, 220);
  g.lineTo(460, 220);
  g.stroke();
  g.strokeStyle = color;
  g.lineWidth = 3;
  g.beginPath();
  for (let s = 0; s <= 1.0001; s += 0.01) {
    const x = 50 + 400 * s;
    const y = 220 - 170 * ((0.9 * s) / (bend + s));
    if (s === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  g.fillStyle = "#1e293b";
  g.font = "600 16px sans-serif";
  g.fillText(label, 60, 250);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("no picture");
  return new Uint8Array(await blob.arrayBuffer());
}

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// The sample zip: the template spreadsheet (its "image" column names the pictures) and the sample pictures it names
export async function downloadSampleZip(zipName: string, sheetName: string, sheetText: string, pictureNames: string[]): Promise<void> {
  const colors = ["#0aa4bf", "#8b5cf6", "#10b981", "#ef4444"];
  const files: Record<string, Uint8Array> = { [sheetName]: strToU8(sheetText) };
  for (const [index, name] of pictureNames.entries()) {
    files[`pictures/${name}`] = await samplePicture(`Sample picture ${index + 1}`, colors[index % colors.length], 0.12 + index * 0.1);
  }
  save(new Blob([zipSync(files) as BlobPart], { type: "application/zip" }), zipName);
}
