import IClientDoc from "../../client/dto";
import GameWeekDAL from "../../game_week/dal";
import IGameWeekDoc from "../../game_week/dto";
import GameWeekTeam from "../../game_week_team/dal";
import IGameWeekTeamDoc from "../../game_week_team/dto";

interface Data {
  clientGameWeekTeam: IGameWeekTeamDoc | null;
  activeGameWeekAvailable: boolean;
  deadlinePassed: boolean;
  isGameWeekFree: boolean;
  lowBalance: boolean;
}

export default async (
  user: IClientDoc,
  activeGW?: IGameWeekDoc
): Promise<Data> => {
  try {
    // Check whether balance of the user is low
    const lowBalance = user.credit < 45 || user.gameweek_package === 0;

    if (!activeGW) {
      return notActiveGW(lowBalance);
    }

    const clientGameWeekTeam = await GameWeekTeam.getByGameWeekAndClientId({
      client_id: user.id,
      game_week_id: activeGW.id,
    });

    const hasDeadlinePassed = activeGW.purchase_deadline < new Date(); // Check deadline passed

    if (!clientGameWeekTeam && hasDeadlinePassed) {
      return notJoinedActiveGW(lowBalance, activeGW);
    } else if (clientGameWeekTeam && hasDeadlinePassed) {
      return joinedAndDeadlinePassed(clientGameWeekTeam, activeGW, lowBalance);
    } else {
      return {
        clientGameWeekTeam,
        activeGameWeekAvailable: true,
        deadlinePassed: false,
        isGameWeekFree: activeGW.is_free,
        lowBalance,
      };
    }
  } catch (error) {
    // Consider handling specific errors here or logging them
    throw error;
  }
};

function notActiveGW(lowBalance: boolean): Data {
  return {
    clientGameWeekTeam: null,
    activeGameWeekAvailable: false,
    deadlinePassed: true,
    isGameWeekFree: false,
    lowBalance,
  };
}

function notJoinedActiveGW(lowBalance: boolean, activeGW: IGameWeekDoc): Data {
  return {
    clientGameWeekTeam: null,
    activeGameWeekAvailable: true,
    deadlinePassed: true,
    isGameWeekFree: activeGW.is_free,
    lowBalance,
  };
}

function joinedAndDeadlinePassed(
  clientGameWeekTeam: IGameWeekTeamDoc,
  activeGW: IGameWeekDoc,
  lowBalance: boolean
): Data {
  return {
    clientGameWeekTeam,
    activeGameWeekAvailable: true,
    deadlinePassed: true,
    isGameWeekFree: activeGW.is_free,
    lowBalance,
  };
}
