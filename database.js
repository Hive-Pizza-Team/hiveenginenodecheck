import Database from "better-sqlite3";
const database = new Database("data/henc.db");
database.pragma("journal_mode = WAL");

import config from './config.json' with { type: "json" };
import { getWitnesses } from "./get_witnesses.js";

// ID | name | missedRounds | lowRC | behindOnBlocks | enabled

database
  .prepare(
    `
    CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        account TEXT NOT NULL UNIQUE,
        missedRoundsInARow INT NOT NULL DEFAULT 0,
        lowRC INT NOT NULL DEFAULT 0,
        behindOnBlocks INT NOT NULL DEFAULT 0,
        enabled INT NOT NULL
    )`
  )
  .run();

database
  .prepare(
    `
    CREATE TABLE IF NOT EXISTS apiNodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        behindOnBlocks INT NOT NULL DEFAULT 0
    )`
  )
  .run();

for (const apiNode of config.hiveEngine.apiNodes) {
  const exists = database.prepare(`SELECT * from apiNodes WHERE url = ?`).get(apiNode);
  if (!exists) {
    database.prepare(`INSERT INTO apiNodes (url) VALUES (?)`).run(apiNode);
  }
}

// TODO: add ip:port from the witness table 

// testing only - we want to notify when new witnesses show up
// const wits = await getWitnesses();
// for (const wit of wits) {
//   if (getWitnessStatus(wit.account)) {
//     // dont try to insert duptes
//     continue;
//   }
// //   insertWitness(wit);
// }



function insertWitness(witnessInfo) {
  database
    .prepare(
      `
        INSERT INTO nodes (account, enabled)
        VALUES (?,?);
        `
    )
    .run(witnessInfo.account, witnessInfo.enabled ? 1 : 0);
}

function getWitnessStatus(account) {
  return database
    .prepare(
      `
        SELECT * FROM nodes 
        WHERE account = ?;
        `
    )
    .get(account);
}

function setWitnessStatus(witnessInfo) {
  // account, enabled, missedRoundsInARow, lowRC, behindOnBlocks

  return database
    .prepare(
      `
        UPDATE nodes
        SET enabled = ?, missedRoundsInARow = ?, lowRC = ?, behindOnBlocks = ?
        WHERE account = ?`
    )
    .run(
      witnessInfo.enabled,
      witnessInfo.missedRoundsInARow,
      witnessInfo.lowRC,
      witnessInfo.behindOnBlocks,
      witnessInfo.account
    );
}

function getApiNodeStatus(url) {
  return database
    .prepare(
      `
        SELECT * FROM apiNodes 
        WHERE url = ?;
        `
    )
    .get(url);
}

function setApiNodeStatus(nodeInfo) {
  // url, behindOnBlocks

  return database
    .prepare(
      `
        UPDATE apiNodes
        SET behindOnBlocks = ?
        WHERE url = ?`
    )
    .run(
      nodeInfo.behindOnBlocks,
      nodeInfo.url
    );
}

export { database, getWitnessStatus, setWitnessStatus, insertWitness, getApiNodeStatus, setApiNodeStatus};
