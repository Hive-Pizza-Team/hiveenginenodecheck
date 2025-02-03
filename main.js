import config from './config.json' with { type: "json" };
import axios from 'axios'
import { send_discord_message } from './discord.js';


async function checkNodes() {

    try {   
        var res = await axios.get(config.primaryNodeRPC);
    } catch(err) {
        console.warn("failed to check our node");
        return;
    }

    const my_lastBlockNumber = res.data.lastBlockNumber;
    const my_lastHash = res.data.lastHash;

    let votesHash = 0;
    let votesBlock = 0
    for (const otherNodeRPC of config.compareNodesRPC) {
        try {
            var other_res = await axios.get(otherNodeRPC);
        } catch (err) {
            console.warn(`${otherNodeRPC} didn't respond`);
            continue;
        }

        if (my_lastBlockNumber == other_res.data.lastBlockNumber) {
            votesBlock += 1;
            if (my_lastHash != other_res.data.lastHash) {
                console.error(otherNodeRPC, 'last hash differs');
                // send_discord_message('HE last hash differs');
            } else {
                votesHash += 1;
            }
        }
    }

    // console.log(`${votesHash} other nodes agree on the hash`);

    if (votesBlock > 0 && votesHash == 0) {
        send_discord_message(`@everyone ${config.primaryNodeRPC} lastHash differs`);
    } else {
        console.info('All good.');
    }
}

checkNodes();
setInterval(checkNodes, config.timeDelay);