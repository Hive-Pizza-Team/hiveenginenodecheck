// check if nodes are behind
// check if nodes diverged
import config from './config.json' with { type: "json" };
import axios from 'axios'
import { send_discord_message } from './discord.js';
import { getWitnesses } from "./get_witnesses.js";
import * as dhive from '@hiveio/dhive';
import { getApiNodeStatus, setApiNodeStatus } from './database.js';

const hiveClient = new dhive.Client(config.hive.apiNodes);

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


async function checkBlocks() {

    const dgp = await hiveClient.database.getDynamicGlobalProperties();

    const apiNodes = config.hiveEngine.apiNodes;

    apiNodes.forEach(async (apiNode) => {
        const status = await getStatus(apiNode);

        if (!status || !status.data) {
            return;
        }
        const lastParsedHiveBlockNumber = status.data.lastParsedHiveBlockNumber;
        const blocksBehind = dgp.head_block_number - lastParsedHiveBlockNumber;

        const oldStatus = getApiNodeStatus(apiNode);

        if (blocksBehind >= 500 && oldStatus.behindOnBlocks == 0) {
            const message = `${apiNode} is ${blocksBehind} blocks behind`;
            console.error(message);
            send_discord_message(message);

            const newStatus = oldStatus;
            newStatus.behindOnBlocks = 1;
            setApiNodeStatus(newStatus);

        } else if (blocksBehind < 20 && oldStatus.behindOnBlocks == 1) {
            const message = `${apiNode} caught up on blocks`;
            console.error(message);
            send_discord_message(message);

            const newStatus = oldStatus;
            newStatus.behindOnBlocks = 0;
            setApiNodeStatus(newStatus);
        }
    });
    
    return;

    const apiNode = config.hiveEngine.apiNodes[0];
    const res = await getStatus(apiNode);

    if (!res || !res.data) {
        return;
    }

    console.info('Checking', apiNode);


    return;
    const my_lastBlockNumber = res.data.lastBlockNumber;
    const my_lastHash = res.data.lastHash;

    let votesHash = 0;
    let votesBlock = 0
    config.compareNodesRPC.forEach(async (otherNodeRPC) => {
        const other_res = await getStatus(otherNodeRPC);

        if (!other_res || !other_res.data) {
            return;
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
                console.info(otherNodeRPC, 'agrees with hash');
            }
        } else if (other_res.data.lastBlockNumber < my_lastBlockNumber) {
            console.info(`We are ${my_lastBlockNumber - other_res.data.lastBlockNumber} blocks ahead of ${otherNodeRPC}`);

            if (!myBlock) {
                return;
            }
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
                return;
            }

            if (my_lastHash == theirBlock.hash) {
                votesHash += 1;
                console.info(otherNodeRPC, 'agrees with hash');
            } else {
                console.error(otherNodeRPC, 'disagrees with hash');
            }
        }
    });

    if (votesHash < config.compareNodesRPC.length / 2) {
        console.error(`@everyone ${config.primaryNodeRPC} lastHash differs`);
        send_discord_message(`@everyone ${config.primaryNodeRPC} lastHash differs`);
    } else {
        console.info('All good.');
    }
}

export {
    checkBlocks
}