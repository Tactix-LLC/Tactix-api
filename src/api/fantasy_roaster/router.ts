import { Router } from "express";
import axios from "axios";
import { IPlayer, ITeam } from "./dto";
const router: Router = Router();
import FantasyRoaster from "./dal";
import Season from "../season/dal";
import Competition from "../competition/dal";
import mongoose from "mongoose";
import configs from "../../configs";

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
  updatePlayerInfo,
  getTeamsFromRoaster,
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
  updatePlayerInfoValidation,
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
router.get('/populate-players/:season_id/:competition_id', async (req, res) => {
  try {
    const { season_id, competition_id } = req.params;
    
    // Get the season details
    const season = await Season.getById(season_id);
    if (!season) {
      return res.status(404).json({ 
        error: 'Season not found' 
      });
    }
    
    // Get the competition details
    const competition = await Competition.getCompetition(competition_id);
    if (!competition) {
      return res.status(404).json({ 
        error: 'Competition not found' 
      });
    }
    
    // Use the selected competition ID and token
    const competitionId = competition.cid;
    const token = configs.entity_sport.token;
    const baseUrl = configs.entity_sport.url;

    console.log(`Fetching all teams from ${competition.competition_name} (competition ${competitionId})`);

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
          // Skip teams with invalid data
          if (!team.tname || !team.tid || !team.squads) {
            console.log(`Skipping invalid team: ${JSON.stringify(team)}`);
            continue;
          }

          console.log(`Processing team: ${team.tname} (${team.tid})`);
          for (const player of team.squads) {
            // Handle potential different field names and null/undefined values
            const playerName = player.fullname || player.name || player.pname || '';
            const playerRole = player.positionname || player.position || player.role || '';
            const playerId = player.pid || player.id || '';

            // More robust validation - check for null, undefined, empty string, and whitespace
            const isValidName = playerName && 
                               typeof playerName === 'string' && 
                               playerName.trim().length > 0 &&
                               playerName.trim() !== 'null' &&
                               playerName.trim() !== 'undefined';
            
            const isValidRole = playerRole && 
                               typeof playerRole === 'string' && 
                               playerRole.trim().length > 0 &&
                               playerRole.trim() !== 'null' &&
                               playerRole.trim() !== 'undefined';
            
            const isValidId = playerId && 
                             typeof playerId === 'string' && 
                             playerId.trim().length > 0 &&
                             playerId.trim() !== 'null' &&
                             playerId.trim() !== 'undefined';

            // Skip players with invalid data
            if (!isValidName || !isValidRole || !isValidId) {
              console.log(`Skipping invalid player - Name: "${playerName}", Role: "${playerRole}", ID: "${playerId}"`);
              continue;
            }

            const playerData: IPlayer = {
              pid: playerId.trim(), // Player ID (string, trimmed)
              pname: playerName.trim(), // Player Full Name (trimmed)
              role: playerRole.trim(), // Player Position (trimmed)
              rating: (player.fantasy_player_rating || player.rating || "").toString(), // Player Fantasy Rating
              prev_rating: "", // Assuming prev_rating is empty for now
              team: {
                tid: team.tid, // Team ID (string)
                tname: team.tname, // Team Name
                fullname: team.fullname || team.tname, // Full team name (fallback to tname)
                abbr: team.abbr || team.tname.substring(0, 3).toUpperCase(), // Team abbreviation (fallback)
                logo: team.teamlogo || "", // Team logo URL (can be empty)
              },
            };

            players.push(playerData);
          }
        }
      }
    }

    console.log(`Total players found: ${players.length} from ${allTeams.length} teams`);

    // Final validation - remove any players that might still have invalid data
    const validPlayers = players.filter(player => {
      const hasValidName = player.pname && player.pname.trim().length > 0;
      const hasValidRole = player.role && player.role.trim().length > 0;
      const hasValidId = player.pid && player.pid.trim().length > 0;
      const hasValidTeam = player.team && player.team.tid && player.team.tname;
      
      if (!hasValidName || !hasValidRole || !hasValidId || !hasValidTeam) {
        console.log(`Removing invalid player from final list: ${JSON.stringify(player)}`);
        return false;
      }
      return true;
    });

    console.log(`Valid players after final filtering: ${validPlayers.length} (removed ${players.length - validPlayers.length} invalid players)`);

    // Find the existing roaster for this season and competition
    const existingRoaster = await FantasyRoaster.getSingleRoasterBySeasonAndCompetition(season_id, competition_id);
    if (!existingRoaster) {
      return res.status(404).json({
        status: "FAIL",
        message: `No roaster found for season "${season.name}" and competition "${competition.competition_name}". Please create a roaster first.`
      });
    }

    // Update the existing roaster with players
    const updatedRoaster = await FantasyRoaster.updateRoasterPlayers(existingRoaster._id, validPlayers);

    // Respond after all players are added
    res.status(200).json({
      status: "SUCCESS",
      message: `Players populated successfully into the roaster. Found ${validPlayers.length} valid players from ${allTeams.length} teams across ${totalPages} pages for ${competition.competition_name}.`,
        data: {
          roaster: updatedRoaster,
          totalPlayers: players.length,
          validPlayers: validPlayers.length,
          invalidPlayers: players.length - validPlayers.length,
          totalTeams: allTeams.length,
          totalPages: totalPages,
          competitionId: competitionId,
          competitionName: competition.competition_name,
          seasonName: season.name
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

router.patch(
  "/:id/player",
  protect,
  auth("Super-admin"),
  validator(updatePlayerInfoValidation),
  updatePlayerInfo
);

router.get(
  "/:id/teams",
  protect,
  auth("Super-admin", "Admin"),
  getTeamsFromRoaster
);

export default router;
