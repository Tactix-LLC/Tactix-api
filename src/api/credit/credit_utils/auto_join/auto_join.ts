import { RequestHandler } from "express";
import GameWeekDAL from "../../../game_week/dal";
import GameWeekTeam from "../../../game_week_team/dal";
import TeamDAL from "../../../team/dal";
import CompetitionDAL from "../../../competition/dal";
import { IPlayersData } from "../../../team/dto";
import Client from "../../../client/dal";
import purchaseOptions from "./purchase_options";
import sendJoinMsg from "./joined_msg";
import agent_commission from "../agent_commission";

/**
 * Automatically adds a user to the list of users who joined the current active game week
 */
export default async (client_id: string, cid: string) => {
  try {
    // Find the logged in user
    const user = await Client.getClientById(client_id);
    if (!user) throw new Error("User not found");

    // Find the active game week
    const gameWeek = await GameWeekDAL.getLiveGameWeek();
    if (gameWeek) {
      // Check client hasn't joined the game_week yet
      const clientGameWeek = await GameWeekTeam.getByGameWeekAndClientId({
        client_id: client_id,
        game_week_id: gameWeek.id,
      });

      // Client has not joined the current active game week yet
      if (!clientGameWeek) {
        // Check purchase_deadline of the current game weeks hasn't passed
        const purchaseDeadline = gameWeek.purchase_deadline.getTime();
        if (purchaseDeadline > new Date(Date.now()).getTime()) {
          // Check team exists and has 15 players
          const clientTeam = await TeamDAL.getClientTeams(client_id);
          if (clientTeam) {
            // Check competition
            const competition = await CompetitionDAL.getCompetitionByCid(cid);

            if (competition) {
              // Put necessary info in one object
              const data: IGameWeekTeamRequest.ICreateGameWeekTeamInput & {
                client_id: string;
                team_id: string;
                game_week_id: string;
                players: Array<IPlayersData>;
              } = {
                client_id,
                team_id: clientTeam.id,
                cid,
                players: clientTeam.players,
                game_week_id: gameWeek.id,
              };

              // Create game week team
              const gameWeekTeam = await GameWeekTeam.createGameWeekTeam(data);

              // Let the client join
              if (gameWeekTeam) {
                // Let the user pay for his package or credit or for free
                await purchaseOptions(user, gameWeek, clientTeam);

                // If client joined Loche by a referal code, create commission to the agent
                if (user.ref_agent_code) {
                  await agent_commission(user.ref_agent_code, user.id);
                }

                // Send message to the user that he/she has joined the game week successfully
                await sendJoinMsg(user, gameWeek.game_week);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log("Error has occurred: ");
    throw new Error("Opps");
  }
};
