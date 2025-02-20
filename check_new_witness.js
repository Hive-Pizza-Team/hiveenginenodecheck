import { getWitnessStatus, setWitnessStatus } from "./database.js";
import { send_discord_message } from "./discord.js";
import { getWitnesses } from "./get_witnesses.js";


async function checkNewWitness() {
    const witnesses = await getWitnesses(true);

    for (const wit of witnesses) {
        const oldStatus = getWitnessStatus(wit.account);

        if (!oldStatus) {
            const message = `new node found: ${wit.account}`;
            console.error(message);
            send_discord_message(message);

            const newStatus = oldStatus;
            newStatus.enabled = 0;
            setWitnessStatus(newStatus);
        }
    }
}

export {
    checkNewWitness
}