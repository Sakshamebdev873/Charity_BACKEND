import cloudinary from "../../config/cloudinary";
import { Readable } from "stream";

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "golf-charity"
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }, { width: 1200, crop: "limit" }] },
      (error, result) => {
        if (error || !result) reject(error || new Error("Upload failed"));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}