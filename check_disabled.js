import { getWitnessStatus, setWitnessStatus } from "./database.js";
import { send_discord_message } from "./discord.js";
import { getWitnesses } from "./get_witnesses.js";


async function checkDisabled() {
    const witnesses = await getWitnesses(false);

    for (const wit of witnesses) {
        const oldStatus = getWitnessStatus(wit.account);

        if (!wit.enabled && oldStatus.enabled == 1) {
            const message = `${wit.account} - disabled`;
            console.error(message);
            send_discord_message(message);

            const newStatus = oldStatus;
            newStatus.enabled = 0;
            setWitnessStatus(newStatus);
            
        } else if (wit.enabled && oldStatus.enabled == 0) {
            const message = `${wit.account} - enabled`;
            console.error(message);
            send_discord_message(message);

            const newStatus = oldStatus;
            newStatus.enabled = 1;
            setWitnessStatus(newStatus);
        } 
    }
}

export {
    checkDisabled
}