import express, { Application, Response, NextFunction, Request } from "express";
const app: Application = express();

// Custom Modules
import AppError from "../utils/app_error";
import geh from "../utils/geh";
import configs from "../configs";
import cors from "cors";
import helmet from "helmet";
import rateLimiter from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";

// Third party middlewares
// Security
app.use(compression());
app.use(cors({ origin: "*", credentials: false }));
app.use(helmet());
app.use(mongoSanitize());
// app.use(
//   rateLimiter({
//     windowMs: 60 * 60 * 1000,
//     max: 1000,
//   })
// );

// Use Built in libraries
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Verify payment
import {
  verifyPayment,
  paymentErrorRedirection,
  paymentSuccessRedirection,
} from "../api/credit/controller";
app.get("/api/v1/credit/verify", verifyPayment);
app.get("/api/v1/credit/success", paymentSuccessRedirection);
app.get("/api/v1/credit/error", paymentErrorRedirection);

// Routers
import adminRouter from "../api/admin/router";
import faqRouter from "../api/faqs/router";
import privacyRouter from "../api/privacy/router";
import termsRouter from "../api/terms_and_conditions/router";
import aboutUsRouter from "../api/about/router";
import clientRouter from "../api/client/router";
import feedbackTitleRouter from "../api/feedback_titles/router";
import feedbackRouter from "../api/feedback/router";
import advertisementRouter from "../api/advertisement/router";
import seasonRouter from "../api/season/router";
import compRouter from "../api/competition/router";
import noteRouter from "../api/notes/router";
import scoutRouter from "../api/scout/router";
import perkRouter from "../api/perks/router";
import transctionRouter from "../api/transaction/router";
import gameWeekRouter from "../api/game_week/router";
import agentRequestRouter from "../api/agent_request/router";
import coachRouter from "../api/coach/router";
import teamRouter from "../api/team/router";
import transferHistoryRouter from "../api/transfer_history/router";
import gameWeekTeamROuter from "../api/game_week_team/router";
import purchaseRouter from "../api/purchase/router";
import creditRouter from "../api/credit/router";
import commissionRouter from "../api/commission/router";
import winnersRouter from "../api/winners/router";
import fantasyRoasterRouter from "../api/fantasy_roaster/router";
import appVersionRouter from "../api/app_version/router";
import playerStatRouter from "../api/players_stat/router";
import dashboardRouter from "../api/dashboard/router";
import InjuriesBanRouter from "../api/injuries_bans/router";
import pollRouter from "../api/poll/router";
import adCompanyRouter from "../api/ad_comp/router";
import adPackageRouter from "../api/ad_packages/router";
import packagesRouter from "../api/packages/router";

// Use Routers
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/faq", faqRouter);
app.use("/api/v1/privacy", privacyRouter);
app.use("/api/v1/aboutus", aboutUsRouter);
app.use("/api/v1/terms", termsRouter);
app.use("/api/v1/client", clientRouter);
app.use("/api/v1/feedbacktitle", feedbackTitleRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/advertisement", advertisementRouter);
app.use("/api/v1/season", seasonRouter);
app.use("/api/v1/competitions", compRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/scout", scoutRouter);
app.use("/api/v1/perk", perkRouter);
app.use("/api/v1/transaction", transctionRouter);
app.use("/api/v1/gameweek", gameWeekRouter);
app.use("/api/v1/agentrequest", agentRequestRouter);
app.use("/api/v1/coach", coachRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/transferhistory", transferHistoryRouter);
app.use("/api/v1/gameweekteam", gameWeekTeamROuter);
app.use("/api/v1/purchase", purchaseRouter);
app.use("/api/v1/credit", creditRouter);
app.use("/api/v1/commission", commissionRouter);
app.use("/api/v1/winners", winnersRouter);
app.use("/api/v1/fantasyroaster", fantasyRoasterRouter);
app.use("/api/v1/appversion", appVersionRouter);
app.use("/api/v1/playerstat", playerStatRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/injuriesban", InjuriesBanRouter);
app.use("/api/v1/poll", pollRouter);
app.use("/api/v1/adcompany", adCompanyRouter);
app.use("/api/v1/adpackages", adPackageRouter);
app.use("/api/v1/packages", packagesRouter);

//Healthcheck endpoint
app.get("/healthcheck", (req, res, next) => {
  try {
    res.status(200).json({
      status: "SUCCESS",
      message: "Healthy!",
    });
  } catch (error) {
    next(error);
  }
});

// Handle Unknown URLs
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(new AppError("Unknown URL", 404));
});

// Use GEH
app.use(geh);

export default app;
