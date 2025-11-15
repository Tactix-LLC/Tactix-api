import { Router } from "express";
import * as controller from "./controller";
import validate from "../../utils/validator";
import { sendContactEmailSchema } from "./validation";

const router = Router();

// POST /api/contact - Send contact form email
router.post(
  "/",
  validate(sendContactEmailSchema),
  controller.sendContactEmail
);

export default router;

