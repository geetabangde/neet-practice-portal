import type { Request, Response } from "express";
import { MAX_IMAGE_BYTES, detectImageType, getImage, isImageToken, saveImage } from "../services/image.service";

// POST /api/admin/images   body: { "fileName": "heart.png", "data": "<the file as base64>" }
// Saves a question image and gives back its token. The question then keeps the token (imageToken).
export async function uploadImageHandler(req: Request, res: Response): Promise<void> {
  const body = (typeof req.body === "object" && req.body !== null ? req.body : {}) as { fileName?: unknown; data?: unknown };
  if (typeof body.data !== "string" || body.data === "") {
    res.status(400).json({ success: false, message: "Send the image file." });
    return;
  }
  const bytes = Buffer.from(body.data, "base64");
  if (bytes.length === 0) {
    res.status(400).json({ success: false, message: "The image file is empty." });
    return;
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    res.status(400).json({ success: false, message: "The image must be smaller than 2 MB." });
    return;
  }
  const mime = detectImageType(bytes);
  if (!mime) {
    res.status(400).json({ success: false, message: "Choose a PNG, JPG, WebP or GIF image." });
    return;
  }
  try {
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    res.status(201).json({ success: true, message: "Image saved", data: { token: await saveImage(fileName, mime, bytes) } });
  } catch (error) {
    console.error("Save image failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}

// GET /api/images/:token  (no login: the page of a student shows it with a plain <img>)
export async function showImageHandler(req: Request, res: Response): Promise<void> {
  const token = req.params.token;
  if (!isImageToken(token)) {
    res.status(404).json({ success: false, message: "Image not found" });
    return;
  }
  try {
    const image = await getImage(token);
    if (!image) {
      res.status(404).json({ success: false, message: "Image not found" });
      return;
    }
    res.set({
      "Content-Type": image.mime,
      // A picture never changes under its token, so the browser may keep it for a year
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // The student site is on another address than the API: let it show the picture
      "Cross-Origin-Resource-Policy": "cross-origin",
    });
    res.send(image.data);
  } catch (error) {
    console.error("Show image failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
