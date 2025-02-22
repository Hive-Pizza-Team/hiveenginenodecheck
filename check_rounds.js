// check if any nodes missed a round or 2
import {getWitnesses} from "./get_witnesses.js";
import config from './config.json' with { type: "json" };
import { getWitnessStatus, setWitnessStatus } from "./database.js";
import { send_discord_message } from "./discord.js";



async function checkRounds() {
    const wits = await getWitnesses(true);

    for (const wit of wits) {
        if (wit.missedRoundsInARow > 0) {
            const oldStatus = getWitnessStatus(wit.account);
            if (oldStatus.missedRoundsInARow != wit.missedRoundsInARow) {
                // should notify = true
                const message = `\`@${wit.account}\` missed ${wit.missedRoundsInARow} rounds`;
                send_discord_message(message);
                console.error(message);
                
                const newStatus = oldStatus;
                newStatus.missedRoundsInARow = wit.missedRoundsInARow;
                setWitnessStatus(newStatus);
            }
        } else {
            const oldStatus = getWitnessStatus(wit.account);
            if (oldStatus.missedRoundsInARow != wit.missedRoundsInARow) {
                // should notify = true
                const message = `\`@${wit.account}\` recovered on rounds`;
                send_discord_message(message);
                console.error(message);

                const newStatus = oldStatus;
                newStatus.missedRoundsInARow = wit.missedRoundsInARow;
                setWitnessStatus(newStatus);
            } 
        }
    }
}


export {
    checkRounds
}

