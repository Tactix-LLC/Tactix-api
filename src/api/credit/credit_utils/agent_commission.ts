import Client from "../../client/dal";
import CommissionDAL from "../../commission/dal";
import GameWeekTeam from "../../game_week_team/dal";

/**
 * Add commission to an agent if the user joined Tactix by a referral code
 */
export default async (agent_code: string, client_id: string) => {
  // If client joined Tactix by a referal code, create commission to the agent
  const clientGameWeekTeams = await GameWeekTeam.getClientGameWeekTeams(
    client_id
  );

  // The agent that refered this logged-in user
  const agent = await Client.getClientByAgentCode(agent_code);
  if (agent && clientGameWeekTeams.length === 1) {
    // Create commission
    await CommissionDAL.createCommission({
      client_id,
      agent_id: agent.id,
    });

    // Update commission balance of agent
    let earnedCommission: number = 0;
    let availableCommission: number = 0;
    if (agent.earned_commission) {
      earnedCommission = agent.earned_commission + 25;
      availableCommission = agent.commission_balance + 25;
    } else {
      earnedCommission = 25;
      availableCommission = 25;
    }
    await Client.updateEarnedAvailableCommission({
      agent_id: agent.id,
      earnedCommission,
      availableCommission,
    });
  } else {
    return;
  }
};
