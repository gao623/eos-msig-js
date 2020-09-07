const pu = require('promisefy-util');

const msig = require("../index");
const util = require("../src/util");
const {
  eosio_msig
} = require("../src/config");

// global.keosdUrl = "http://192.168.1.58:9999";
global.keosdUrl = "http://192.168.47.159:9999";

const keosd = require("./keosdjs/keosd");
const { off } = require('process');

async function getHistoryAction(client, contract, actName, proposer, pos, offset) {
  let historyActions = await client.rpc.history_get_actions(contract, pos, offset);
  let last_irreversible_block = historyActions.last_irreversible_block;

  theActions = historyActions.actions.filter(currAction => {
    let trace = currAction.action_trace || currAction;
    return currAction.block_num <= last_irreversible_block && trace && (actName === trace.act.name) && (trace.act.data.proposer === proposer);
  });
  console.log("getHistoryAction", JSON.stringify(theActions));
  return theActions;
}

async function approve(wallet, url, msigAccountPerm, senderPerm) {
  let start = 0;
  let offset = 30;
  let foundOne = false;
  let result;
  let client = util.newClient(url, wallet.privateKeys);

  while (true) {
    let approveList = await util.getRequestApproveList(client, msigAccountPerm);
    console.log("approveList", approveList);

    // let theActions = [];
    // for (let item of approveList) {
    //   let currAct = await getHistoryAction(client, eosio_msig, "propose", item.actor, start, offset);
    //   theActions = theActions.concat(currAct);
    // }
    let multiHistoryActionQuery = approveList.map(async (item) => {
      return await getHistoryAction(client, eosio_msig, "propose", item.actor, start, offset);
    });
    let multiHistoryActionResult = await Promise.all(multiHistoryActionQuery);
    console.log(multiHistoryActionResult);
    let theActions = util.deepArrayFlatten(multiHistoryActionResult);

    if (!theActions.length) {
      continue;
    }

    let multiApproveRequest = theActions.map(async(currAction) => {
      let trace = currAction.action_trace || currAction;
      const { account, name, authorization, data } = trace.act;
      let tableRows = await client.rpc.get_table_rows({
        json: true,
        code: eosio_msig,
        scope: data.proposer,
        table: "proposal",
        lower_bound: data.proposal_name,
        upper_bound: data.proposal_name,
        index_position: 1
      });
      console.log("tableRows", tableRows);
      if (!tableRows || !tableRows.rows.length) {
        console.log("no data in table proposal")
        return;
      }

      let signedTx;
      if (wallet.privateKeys) {
        console.log("privateKeys")
        signedTx = await msig.rawTrans.createApproveTrans(client, data.proposer, data.proposal_name, null, senderPerm, {sign: true});
      } else {
        console.log("=============================keosd")
        let isUnlock = await pu.promisefy(keosd.unlock, [wallet.name, wallet.passwd], keosd);
        console.log("unlock wallet", wallet.name, isUnlock);
    
        let pubKeys = await pu.promisefy(keosd.get_public_keys);
        console.log("public keys", pubKeys);
        let approveTx = await msig.rawTrans.createApproveTrans(client, data.proposer, data.proposal_name, null, senderPerm);
        let approveJSONTx = await client.deserializeTransaction(approveTx.serializedTransaction);
        console.log("approveJSONTx", approveJSONTx);
    
        let requireKeys = await client.rpc.getRequiredKeys({transaction: approveJSONTx, availableKeys: pubKeys});
        console.log("getRequiredKeys:", requireKeys);
    
        let info = await client.rpc.get_info();
        let chainId = info.chain_id;
    
        let signTrans = await pu.promisefy(keosd.sign_transaction, [approveJSONTx, requireKeys, chainId]);
    
        signedTx = {};
        signedTx.signatures = signTrans.signatures;
        signedTx.serializedTransaction = approveTx.serializedTransaction; // await client.serializeTransaction(approveTx);
    
      }
      console.log("signedTx", signedTx);
      result = await client.pushSignedTransaction(signedTx);
      console.log("approveTx", JSON.stringify(result));
      foundOne = true;
    });

    let multiApproveResponse = await Promise.all(multiApproveRequest);
    console.log("multiApproveResponse", JSON.stringify(multiApproveResponse));

    if (foundOne) {
      return result;
    } else {
      start += off;
    }

    await util.sleep(500);
  }
}

async function test(wallet, url, msigAccountPerm, senderPerms) {
  let multiApproveRequest = senderPerms.map(async(senderPerm) => {
    await approve(wallet, url, msigAccountPerm, senderPerm);
  });
  let multiApproveResponse = await Promise.all(multiApproveRequest);
}

const node_url = "https://jungle3.cryptolions.io:443";

// const wallet = {
//   name:"multisig",
//   // passwd:"PW5JARiVYiNV226pYhhG6ULs7UXU31UsFX1LjUWjKFWYQfkBDTDq8"// 58
//   passwd:"PW5Jh1B6x2VaEEK3vEhN8igmAZeAZvdTAswYRch3ePTtWJiKady3K"
// };
// const wallet = {
//   privateKeys:process.env.EOS_KEYS
// };
const wallet = {
  privateKeys:[
    "5JpABcR3r1zwwGLUhZ6oykpZhoMRorUE9jCEErcLRHYVfY3Y4C6", // EOS89MiYBW3r2V5GJVbazsSyENZspV3t7fK82sNEN2DhgzmXVWx9x
    "5JyyPpjBXYBRDz4g9wT3VFPvU9p9whyWSghEia1D5b7owgn47nP", // EOS5FtHtHZeHgnCugyxgsKMWDVXYoUbZFajMZX4SR45GABnwWfgng
    "5JMrg3FpW8KHteh3amSvkm9k3dfvYyEhWqNe3MhR4bQFLZqQQ1C", // EOS6vZYjUbEYWp1fKMqGkeLCJhtaSfJ6k2sHkzEeYxBJE6aSWVAJ2
    "5JU9uiA2r5cJtbvErWkKGvb77Y4xd6H5UfP5XhHGsBCk8wwaYCJ", // EOS6RKD7WaXD3oPpoj3ki1LqmhYYwVZfH7XkDXXwcKR1nTYKHZEcS
    "5K1csZUYhnJtrDcGACXGP4dASFZVi8NjbjnXSaw3c8nxrToLPcy", // EOS6ztBxqYoZkC2qfqqukv3FVs3nBnaeswuoed1sHEF9sUzQu6v8p
  ]
};


const senderPerms = [{
  actor: "3214ertyytre",
  permission: "active"
}, {
  actor: "3edcwertdfgh",
  permission: "active"
}];

const msigAccountPerm = {
  actor: "okmijnuhbygv",
  permission: "active",
  parentPermission: "owner"
}

test(wallet, node_url, msigAccountPerm, senderPerms);