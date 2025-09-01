import { Router } from "express";
import axios from "axios";
import { IPlayer, ITeam } from "./dto";
const router: Router = Router();
import FantasyRoaster from "./dal";
import mongoose from "mongoose";

// Controllers
import {
  createFantasyRoaster,
  getActiveRoaster,
  getAllRoasters,
  getFantasyRoaster,
  updatePlayerRating,
  updateRoasterStatus,
  deleteAllRoasters,
  deleteRoaster,
  updateTransferRadar,
  removePlayer,
  addPlayer,
  updatePlayerTeam,
} from "./controller";

// Validations
import {
  updateRoasterValidation,
  updatePlayerRatingValidaton,
  deleteAllRoastersValidation,
  updateTransferRadarValidation,
  removePlayerValidation,
  addPlayerValidation,
  updatePlayerTeamValidation,
} from "./validation";

// Protect
import protect from "../../utils/protect";

// Auth
import auth from "../../utils/auth";

// Validator
import validator from "../../utils/validator";

router.get("/all", protect, auth("Super-admin", "Admin"), getAllRoasters);

// To Populate the roaster
// Endpoint to fetch and populate players
router.get('/populate-players', async (req, res) => {
  try {
    // Fetch data from the endpoint
    const response = await axios.get('https://soccer.entitysport.com/competition/992/squad?token=44689d60663efa7ad59e4903675b794e'); // Replace with your endpoint
    const teams = response.data.response.teams;

    console.log("INITIATED");

    // Map teams and squads to IPlayer[]
    const players: IPlayer[] = [];

    for (const team of teams) {
      for (const player of team.squads) {
        const playerData: IPlayer = {
          pid: player.pid, // Player ID (string)
          pname: player.fullname, // Player Full Name
          role: player.positionname, // Player Position
          rating: player.fantasy_player_rating || "", // Player Fantasy Rating
          prev_rating: "", // Assuming prev_rating is empty for now
          team: {
            tid: team.tid, // Team ID (string)
            tname: team.tname, // Team Name
            fullname: team.fullname, // Full team name
            abbr: team.abbr, // Team abbreviation
            logo: team.teamlogo, // Team logo URL
          },
        };

        players.push(playerData);
      }
    }

    // Call the function to create the FantasyRoaster record
    await FantasyRoaster.createFantasyRoaster({
      season_name: "Test", // Season name
      players: players, // List of players
    });

    // Respond after all players are added
    res.status(200).json({
      status: "SUCCESS",
      message: "Players populated successfully into the roaster",
    });
  } catch (error) {
    console.error('Error populating players:', error);
    res.status(500).json({ error: 'Failed to populate players' });
  }
});

router
  .route("/")
  .post(protect, auth("Super-admin"), createFantasyRoaster)
  .get(getActiveRoaster)
  .delete(
    protect,
    auth("Super-admin"),
    validator(deleteAllRoastersValidation),
    deleteAllRoasters
  );

router
  .route("/:id")
  .get(protect, auth("Super-admin", "Admin"), getFantasyRoaster)
  .delete(protect, auth("Super-admin"), deleteRoaster);

router.patch(
  "/:id/status",
  protect,
  auth("Super-admin"),
  validator(updateRoasterValidation),
  updateRoasterStatus
);

router.patch(
  "/:id/price",
  protect,
  auth("Super-admin"),
  validator(updatePlayerRatingValidaton),
  updatePlayerRating
);

router.patch(
  "/:id/transfer",
  protect,
  auth("Super-admin"),
  validator(updateTransferRadarValidation),
  updateTransferRadar
);

router.patch(
  "/:id/removeplayer",
  protect,
  auth("Super-admin"),
  validator(removePlayerValidation),
  removePlayer
);

router.patch(
  "/:id/addplayer",
  protect,
  auth("Super-admin"),
  validator(addPlayerValidation),
  addPlayer
);

router.patch(
  "/:id/team",
  protect,
  auth("Super-admin"),
  validator(updatePlayerTeamValidation),
  updatePlayerTeam
);

export default router;
