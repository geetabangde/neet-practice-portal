import { apiRequest, type ApiResult } from "@/lib/api";
import { API_URL } from "@/lib/auth";

// Where the picture of a question is shown from. It needs no login: the student site shows it with a plain <img>.
export const imageUrl = (token: string): string => `${API_URL}/api/images/${token}`;

// The file as base64 text, the way the backend takes it
function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      resolve(text.slice(text.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Saves the picture on the server and gives back its token. The question keeps the token (imageToken).
export async function uploadQuestionImage(file: File): Promise<ApiResult<{ token: string }>> {
  let data: string;
  try {
    data = await readAsBase64(file);
  } catch {
    return { ok: false, status: 0, message: "The image could not be read. Choose it again." };
  }
  return apiRequest<{ token: string }>("/api/admin/images", { method: "POST", body: { fileName: file.name, data } });
}
