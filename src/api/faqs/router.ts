import { Router } from "express";
const router: Router = Router();

//controllers
import {
  createFaq,
  getFaqs,
  getFaq,
  changePublishedStatus,
  updateSingleFaq,
  deleteFaq,
  deleteFaqs,
  getEveryFaq,
} from "./controller";

//validation
import {
  createFaqValidation,
  deleteAllFAQValidation,
  updateFaqValidation,
  updateStatusValidation,
} from "./validation";
import validator from "../../utils/validator";

//middlewers
import auth from "../../utils/auth";
import protect from "../../utils/protect";

router
  .route("/")
  .post(protect, auth("Super-admin"), validator(createFaqValidation), createFaq)
  .get(getFaqs)
  .delete(protect, auth("Super-admin"), validator(deleteAllFAQValidation), deleteFaqs);

router.get("/all", protect, auth("Super-admin", "Admin"), getEveryFaq);

router
  .route("/:id")
  .get(getFaq)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updateFaqValidation),
    updateSingleFaq
  )
  .delete(protect, auth("Super-admin"), deleteFaq);

router.patch(
  "/changestatus/:id",
  protect,
  auth("Super-admin"),
  validator(updateStatusValidation),
  changePublishedStatus
);

export default router;
