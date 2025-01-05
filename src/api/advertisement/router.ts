import { Router } from "express";

const router: Router = Router();

import validator from "../../utils/validator";

import {
  createAdvertisement,
  deleteAdvertisement,
  deleteAdvertisements,
  getActiveAdOfCompany,
  getActiveAdsByPackage,
  getAd,
  getAdsByPackage,
  getAdsOfCompany,
  getAllAds,
  getEveryAds,
  updateAd,
  updateAdCalendar,
  updateAdStatus,
  updateImage,
} from "./controller";

import protect from "../../utils/protect";
import auth from "../../utils/auth";
import {
  createAdsValidation,
  updateAdsValidator,
  updateAdStatusValidator,
  updateImgValidator,
  updateAdCalendarValidator,
  validateDeleteAllAPI,
} from "./validation";

router
  .route("/")
  .post(
    protect,
    auth("Super-admin"),
    validator(createAdsValidation),
    createAdvertisement
  )
  .delete(
    protect,
    auth("Super-admin"),
    validator(validateDeleteAllAPI),
    deleteAdvertisements
  )
  .get(protect, auth("Super-admin", "Client"), getAllAds);

router.get("/all", protect, auth("Super-admin"), getEveryAds);

router.get(
  "/active/company/:compId",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getActiveAdOfCompany
);

router.get(
  "/all/company/:compId",
  protect,
  auth("Super-admin", "Admin"),
  getAdsOfCompany
);

router.get(
  "/active/package/:packId",
  protect,
  auth("Super-admin", "Admin", "Client"),
  getActiveAdsByPackage
);

router.get(
  "/all/package/:packId",
  protect,
  auth("Super-admin", "Admin"),
  getAdsByPackage
);

router
  .route("/:id")
  .delete(protect, auth("Super-admin"), deleteAdvertisement)
  .patch(
    protect,
    auth("Super-admin"),
    validator(updateAdsValidator),
    protect,
    auth("Super-admin"),
    updateAd
  )
  .get(protect, auth("Super-admin"), getAd);

router.patch(
  "/updatestatus/:id",
  protect,
  auth("Super-admin"),
  validator(updateAdStatusValidator),
  updateAdStatus
);

router.patch(
  "/updateimage/:id",
  protect,
  auth("Super-admin"),
  validator(updateImgValidator),
  updateImage
);

router.patch(
  "/updatecalendar/:id",
  protect,
  auth("Super-admin"),
  validator(updateAdCalendarValidator),
  updateAdCalendar
);

// Export router
export default router;
