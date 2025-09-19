import { Router } from "express";
import axios from "axios";
import { IPlayer, ITeam } from "./dto";
const router: Router = Router();
import FantasyRoaster from "./dal";
import Season from "../season/dal";
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
router.get('/populate-players/:season_id', async (req, res) => {
  try {
    const { season_id } = req.params;
    
    // Get the season details
    const season = await Season.getById(season_id);
    if (!season) {
      return res.status(404).json({ 
        error: 'Season not found' 
      });
    }
    
    // Use the hardcoded Premier League competition ID and token
    const competitionId = '992';
    const token = '44689d60663efa7ad59e4903675b794e';
    const baseUrl = 'https://soccer.entitysport.com';

    console.log(`Fetching all teams from Premier League (competition ${competitionId})`);

    // First, get the first page to determine total pages
    const firstPageResponse = await axios.get(
      `${baseUrl}/competition/${competitionId}/squad?token=${token}&paged=1`
    );
    
    if (firstPageResponse.data.status !== "ok") {
      return res.status(400).json({ 
        error: 'Failed to fetch data from Entity Sport API' 
      });
    }

    const totalPages = firstPageResponse.data.response.total_pages || 1;
    console.log(`Found ${totalPages} pages of teams`);

    // Map teams and squads to IPlayer[]
    const players: IPlayer[] = [];
    const allTeams: any[] = [];

    // Fetch all pages
    for (let page = 1; page <= totalPages; page++) {
      console.log(`Fetching page ${page}/${totalPages}`);
      
      const response = await axios.get(
        `${baseUrl}/competition/${competitionId}/squad?token=${token}&paged=${page}`
      );
      
      if (response.data.status === "ok") {
        const teams = response.data.response.teams;
        allTeams.push(...teams);
        
        for (const team of teams) {
          console.log(`Processing team: ${team.tname} (${team.tid})`);
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
      }
    }

    console.log(`Total players found: ${players.length} from ${allTeams.length} teams`);

    // Call the function to create the FantasyRoaster record
    await FantasyRoaster.createFantasyRoaster({
      season_name: season.name, // Use the actual season name
      season_id: season_id, // Use the season ID
      players: players, // List of players
    });

    // Respond after all players are added
    res.status(200).json({
      status: "SUCCESS",
      message: `Players populated successfully into the roaster. Found ${players.length} players from ${allTeams.length} teams across ${totalPages} pages.`,
      data: {
        totalPlayers: players.length,
        totalTeams: allTeams.length,
        totalPages: totalPages,
        competitionId: competitionId
      }
    });
  } catch (error) {
    console.error('Error populating players:', error);
    res.status(500).json({ 
      error: 'Failed to populate players',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
