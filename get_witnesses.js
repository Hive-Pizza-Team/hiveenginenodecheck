import axios from "axios";
import config from './config.json' with { type: 'json' };

// TODO: cache the witness data
var WITNESS_DATA_CACHE;
var CACHE_EXPIRATION = 0;

async function getWitnesses(enabledOnly = false) {
  const timeNow = new Date().getTime() / 1000;
  if (timeNow > CACHE_EXPIRATION) {
    WITNESS_DATA_CACHE = await _getWitnessesNoCache();
    CACHE_EXPIRATION = (new Date().getTime() / 1000) + 3;
  }

  if (!WITNESS_DATA_CACHE) {
    return;
  }

  if (!enabledOnly) {
    return WITNESS_DATA_CACHE;
  } else {
    return WITNESS_DATA_CACHE.filter((w) => w.enabled);
  }
}

async function _getWitnessesNoCache(apiNode, apiNodeNext) {
  for (const apiNode of config.hiveEngine.apiNodes) {
    try {
      var witnesses = await axios({
        method: "post",
        url: apiNode + "/contracts",
        data: {
          jsonrpc: "2.0",
          method: "find",
          params: {
            contract: "witnesses",
            table: "witnesses",
            query: {},
            limit: 100, // default: 1000
            offset: 0, // default: 0
            indexes: [{ index: "approvalWeight", descending: true }], // default: empty, an index is an object { index: string, descending: boolean },
          },
          id: 1,
        },
      });
      return witnesses.data.result;
    } catch (err) {
      console.warn(`${apiNode} didn't respond`, err);
    }
  }
}

async function getWitness(witnessName) {
  if (!witnessName) {
    return;
  }
  const wits = await getWitnesses();
  return wits.find((wit) => {
    return wit.account == witnessName;
  });
}

export { getWitnesses, getWitness };
