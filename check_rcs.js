import * as dhive from "@hiveio/dhive"
import {getWitnesses} from "./get_witnesses.js";
import config from './config.json' with { type: "json" };
import { send_discord_message } from "./discord.js";
import { getWitnessStatus, setWitnessStatus } from "./database.js";

const client = new dhive.Client(config.hive.apiNodes);

async function checkRCs() {
    const accounts = await getWitnesses(true);
    const accountNames = accounts.map((item => {return item.account}));
    let rcsMany = await client.rc.findRCAccounts(accountNames) ;

    for (const rcsOne of rcsMany) {
        const pct = parseFloat(rcsOne.rc_manabar.current_mana / rcsOne.max_rc * 100);
        const oldStatus = getWitnessStatus(rcsOne.account);

        if (pct <= config.checkRCs.pctLowThreshold && oldStatus.lowRC != 1) {
            const message = `\`@${rcsOne.account}\` - has ${pct}% RCs`
            console.error(message);
            send_discord_message(message);

            const newStatus = oldStatus;
            newStatus.lowRC = 1;
            setWitnessStatus(newStatus);
            
        } else if (pct > config.checkRCs.pctHighThreshold && oldStatus.lowRC == 1) {
            const message = `\`@${rcsOne.account}\` - recovered to ${pct}% RCs`;
            console.error(message);
            send_discord_message(message);

            const newStatus = oldStatus;
            newStatus.lowRC = 0;
            setWitnessStatus(newStatus);
        }
    }
}

export {
    checkRCs
}