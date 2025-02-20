import config from './config.json' with { type: "json" };
import { checkRounds } from './check_rounds.js';
import { checkRCs } from './check_rcs.js';
import { checkBlocks } from './check_blocks.js';
import { checkDisabled } from './check_disabled.js';

await checkRounds();
setInterval(checkRounds, config.checkRounds.timeDelay); 

await checkRCs();
setInterval(checkRCs, config.checkRCs.timeDelay);

await checkBlocks();
setInterval(checkBlocks, config.checkBlocks.timeDelay);

await checkDisabled();
setInterval(checkDisabled, config.checkDisabled.timeDelay);