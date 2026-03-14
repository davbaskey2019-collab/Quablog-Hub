import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import questionsRouter from "./questions.js";
import answersRouter from "./answers.js";
import answersStandaloneRouter from "./answers-standalone.js";
import blogsRouter from "./blogs.js";
import uploadRouter from "./upload.js";
import settingsRouter from "./settings.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/questions", questionsRouter);
router.use("/questions/:questionId/answers", answersRouter);
router.use("/answers", answersStandaloneRouter);
router.use("/blogs", blogsRouter);
router.use("/upload", uploadRouter);
router.use("/settings", settingsRouter);
router.use("/admin", adminRouter);

export default router;
