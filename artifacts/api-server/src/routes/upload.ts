import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { authenticate, type AuthRequest, requireAdmin } from "../middlewares/auth.js";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /api/upload/image
router.post("/image", authenticate, upload.single("file"), async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const type = req.body.type as string;
  // logo/favicon upload requires admin
  if ((type === "logo" || type === "favicon") && req.user!.role !== "admin") {
    fs.unlinkSync(req.file.path);
    res.status(403).json({ error: "Admin access required for logo/favicon upload" });
    return;
  }

  const filename = req.file.filename;
  const url = `/api/uploads/${filename}`;
  res.json({ url, filename });
});

export default router;
