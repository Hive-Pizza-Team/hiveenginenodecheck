import config from './config.json' with { type: "json" };
import axios from 'axios'
import { send_discord_message } from './discord.js';

async function getBlockInfo(nodeURL, blockNumber) {
    try {
        var other_node_block = await 
        axios({
            method: "post",
            url: nodeURL + "/blockchain",
            data: {
                    "jsonrpc": "2.0",
                    "method": "getBlockInfo",
                    "params": {
                        "blockNumber": blockNumber
                    },
                    "id": 1
                },
          });
          return other_node_block.data.result;
    } catch (err) {
        console.warn(`${nodeURL} didn't respond`);
    }
}

async function getStatus(nodeURL, blockNumber) {
    try {   
        const res = await axios.get(nodeURL);
        if (!res.data) {
            throw(`failed to check status of node ${nodeURL}`);
        }
        return res;
    } catch(err) {
        console.warn("failed to check status of node", nodeURL);
        return;
    }
}


async function checkNodes() {

    const res = await getStatus(config.primaryNodeRPC);

    if (!res || !res.data) {
        return;
    }

    console.info('Checking', config.primaryNodeRPC);

    const my_lastBlockNumber = res.data.lastBlockNumber;
    const my_lastHash = res.data.lastHash;

    let votesHash = 0;
    let votesBlock = 0
    for (const otherNodeRPC of config.compareNodesRPC) {
        const other_res = await getStatus(otherNodeRPC);

        if (!other_res || !other_res.data) {
            continue;
        }
        
        const theirBlockHash = other_res.data.lastHash;
        const myBlock = await getBlockInfo(config.primaryNodeRPC, other_res.data.lastBlockNumber);

        if (my_lastBlockNumber == other_res.data.lastBlockNumber) {
            console.info(`We are 0 blocks ahead of ${otherNodeRPC}`);
            votesBlock += 1;
            if (my_lastHash != other_res.data.lastHash) {
                console.error(otherNodeRPC, 'last hash differs');
            } else {
                votesHash += 1;
            }
        } else if (other_res.data.lastBlockNumber < my_lastBlockNumber) {
            console.info(`We are ${my_lastBlockNumber - other_res.data.lastBlockNumber} blocks ahead of ${otherNodeRPC}`);

            // console.log(myBlock.hash, theirBlock.hash, myBlock.hash == theirBlock.hash);
            if (myBlock.hash == theirBlockHash) {
                votesHash += 1;
                console.info(otherNodeRPC, 'agrees with hash');
            } else {
                console.error(otherNodeRPC, 'disagrees with hash');
            }
        } else if (other_res.data.lastBlockNumber > my_lastBlockNumber) {
            console.info(`We are ${other_res.data.lastBlockNumber - my_lastBlockNumber } blocks behind ${otherNodeRPC}`);

            const theirBlock = await getBlockInfo(otherNodeRPC, my_lastBlockNumber);

            if (!theirBlock || !theirBlock.hash) {
                console.error("Failed to get hash for ", otherNodeRPC);
                continue;
            }

            if (my_lastHash == theirBlock.hash) {
                votesHash += 1;
                console.info(otherNodeRPC, 'agrees with hash');
            } else {
                console.error(otherNodeRPC, 'disagrees with hash');
            }
        }
    }


    if (votesHash < config.compareNodesRPC.length / 2) {
        console.error(`@everyone ${config.primaryNodeRPC} lastHash differs`);
        send_discord_message(`@everyone ${config.primaryNodeRPC} lastHash differs`);
    } else {
        console.info('All good.');
    }
}

checkNodes();
setInterval(checkNodes, config.timeDelay);