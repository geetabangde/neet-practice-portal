import { randomBytes } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";

// Question images are kept in the database (not on disk): a hosting service that redeploys the site wipes the files
// next to the code, but the database stays. A question points at its image with a long random token, and the picture
// is shown at /api/images/<token>. A new picture gets a new token, so browsers can keep each one forever.
//
// A picture is saved in pieces of 256 KB, one row each (question_image_chunks). A database refuses a single value
// bigger than its "max_allowed_packet" (only 1 MB on a default XAMPP), so one piece at a time works on any server.
export const CREATE_IMAGE_TABLES = [
  `CREATE TABLE IF NOT EXISTS question_images (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    token      CHAR(32) NOT NULL,
    mime       VARCHAR(30) NOT NULL,
    file_name  VARCHAR(255) NOT NULL DEFAULT '',
    size       INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_question_images_token (token)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS question_image_chunks (
    image_id INT UNSIGNED NOT NULL,
    position SMALLINT UNSIGNED NOT NULL,
    data     MEDIUMBLOB NOT NULL,
    PRIMARY KEY (image_id, position),
    CONSTRAINT fk_question_image_chunks_image FOREIGN KEY (image_id) REFERENCES question_images (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// The database is sent bytes as hex text (two characters for each byte), so a piece of 256 KB is a 512 KB value: well under 1 MB
const CHUNK_BYTES = 256 * 1024;

export const isImageToken = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{32}$/.test(value);

// The type of a picture from its first bytes, never from the name or the type the browser claims.
// SVG is not allowed: it can carry scripts.
export function detectImageType(bytes: Buffer): "image/png" | "image/jpeg" | "image/gif" | "image/webp" | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 6 && (bytes.subarray(0, 6).toString("ascii") === "GIF87a" || bytes.subarray(0, 6).toString("ascii") === "GIF89a")) return "image/gif";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

// Saves a picture and gives back its token. Pictures that no question uses and that are over a day old are removed
// at the same time (their pieces go with them), so replaced and abandoned uploads do not pile up.
export async function saveImage(fileName: string, mime: string, bytes: Buffer): Promise<string> {
  await pool.query(
    "DELETE FROM question_images WHERE created_at < (NOW() - INTERVAL 1 DAY) AND token NOT IN (SELECT image_token FROM questions WHERE image_token IS NOT NULL)" +
      " AND token NOT IN (SELECT image_token FROM test_series_questions WHERE image_token IS NOT NULL)",
  );
  const token = randomBytes(16).toString("hex");
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>("INSERT INTO question_images (token, mime, file_name, size) VALUES (?, ?, ?, ?)", [token, mime, fileName.slice(0, 255), bytes.length]);
    const imageId = result.insertId;
    for (let start = 0, position = 0; start < bytes.length; start += CHUNK_BYTES, position += 1) {
      await connection.query("INSERT INTO question_image_chunks (image_id, position, data) VALUES (?, ?, ?)", [imageId, position, bytes.subarray(start, start + CHUNK_BYTES)]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return token;
}

export async function getImage(token: string): Promise<{ mime: string; data: Buffer } | null> {
  const [images] = await pool.query<(RowDataPacket & { id: number; mime: string })[]>("SELECT id, mime FROM question_images WHERE token = ? LIMIT 1", [token]);
  if (!images[0]) return null;
  const [chunks] = await pool.query<(RowDataPacket & { data: Buffer })[]>("SELECT data FROM question_image_chunks WHERE image_id = ? ORDER BY position ASC", [images[0].id]);
  return { mime: images[0].mime, data: Buffer.concat(chunks.map((chunk) => chunk.data)) };
}

export async function imageExists(token: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT 1 FROM question_images WHERE token = ? LIMIT 1", [token]);
  return rows.length > 0;
}

// An older database has questions without the image_token column: this adds it. Safe to run again.
export async function migrateImageToken(): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'image_token'",
  );
  if (rows.length > 0) return false;
  await pool.query("ALTER TABLE questions ADD COLUMN image_token CHAR(32) NULL AFTER image_name");
  return true;
}

// The first version kept the whole picture in one column (question_images.data). This moves such pictures into pieces
// and drops the column. It does nothing when the column is not there. Safe to run again.
export async function migrateImageChunks(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_images' AND COLUMN_NAME = 'data'",
  );
  if (rows.length === 0) return 0;
  const [images] = await pool.query<(RowDataPacket & { id: number; data: Buffer })[]>("SELECT id, data FROM question_images");
  for (const image of images) {
    for (let start = 0, position = 0; start < image.data.length; start += CHUNK_BYTES, position += 1) {
      await pool.query("INSERT IGNORE INTO question_image_chunks (image_id, position, data) VALUES (?, ?, ?)", [image.id, position, image.data.subarray(start, start + CHUNK_BYTES)]);
    }
  }
  await pool.query("ALTER TABLE question_images DROP COLUMN data");
  return images.length;
}
