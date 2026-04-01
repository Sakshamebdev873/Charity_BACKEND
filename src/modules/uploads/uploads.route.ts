import { Router, Request, Response } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import { uploadSingle } from "../../common/middleware/upload.middleware";
import { uploadToCloudinary } from "../../common/utils/upload";

const router = Router();

// Generic image upload — returns Cloudinary URL
router.post("/image", authenticate, (req: Request, res: Response) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    try {
      const folder = (req.query.folder as string) || "golf-charity";
      const result = await uploadToCloudinary(req.file.buffer, folder);
      res.json({
        success: true,
        data: { url: result.url, publicId: result.publicId },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Upload failed" });
    }
  });
});

export default router;