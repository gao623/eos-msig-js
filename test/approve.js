const pu = require('promisefy-util');

const msig = require("../index");
const util = require("../src/util");
const {
  eosio_msig
} = require("../src/config");

// global.keosdUrl = "http://192.168.1.58:9999";
global.keosdUrl = "http://192.168.47.159:9999";

const keosd = require("./keosdjs/keosd");

async function approve(wallet, url, msigAccountPerm, proposalName, senderPerm) {
  let client = util.newClient(url, wallet.privateKeys);
  let approveList = await util.getRequestApproveList(client, msigAccountPerm);
  console.log("approveList", approveList);

  let proposerListQuery = approveList.map(async (item) => {
    let tableRows = await client.rpc.get_table_rows({
      code: eosio_msig,
      scope: item.actor,
      table: "proposal",
      lower_bound: proposalName,
      upper_bound: proposalName,
      index_position: 1
    });
    console.log(item.actor, proposalName, tableRows);
    return {
      proposer: item.actor,
      rows: tableRows.rows
    };
  });

  let proposerListResult = await Promise.all(proposerListQuery);
  let proposerListRows = util.deepArrayFlatten(proposerListResult);
  console.log("tableRows", proposerListRows);

  for (let proposerRows of proposerListRows) {
    if (!proposerRows.rows.length) {
      continue;
    }
    for (let currProposer of proposerRows.rows) {
      console.log(currProposer);
      let buffer = Buffer.from(currProposer.packed_transaction, 'hex');
      let proposeTx = client.deserializeTransaction(new Uint8Array(buffer, buffer.length));
      console.log("proposeTx", JSON.stringify(proposeTx));
      let needApprove = proposeTx.actions.every(item => {
        return item.authorization.every(auth => {
          return auth.actor === msigAccountPerm.actor && auth.permission === msigAccountPerm.permission;
        })
      });
      console.log("needApprove", needApprove);

      if (!needApprove) {
        continue;
      }

      let signedTx;
      if (wallet.privateKeys) {
        console.log("privateKeys")
        signedTx = await msig.rawTrans.createApproveTrans(client, proposerRows.proposer, currProposer.proposal_name, null, senderPerm, {sign: true});
      } else {
        console.log("=============================keosd")
        // keosd.unlock(wallet.name, wallet.passwd, (err, result) => {
        //   if (err) {
        //     console.log("unlock.error:", err);
        //   } else {
        //     console.log("unlock:", result);
        //   }
        // });
    
        let isUnlock = await pu.promisefy(keosd.unlock, [wallet.name, wallet.passwd], keosd);
        console.log("unlock wallet", wallet.name, isUnlock);
    
        let pubKeys = await pu.promisefy(keosd.get_public_keys);
        console.log("public keys", pubKeys);
        let approveTx = await msig.rawTrans.createApproveTrans(client, proposerRows.proposer, currProposer.proposal_name, null, senderPerm);
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
      let result = await client.pushSignedTransaction(signedTx);
      console.log(senderPerm.actor, "approveTx", JSON.stringify(result));
    }
  }
}

async function test(wallet, url, msigAccountPerm, proposalName, senderPerms) {
  let multiApproveRequest = senderPerms.map(async(senderPerm) => {
    await approve(wallet, url, msigAccountPerm, proposalName, senderPerm);
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

// test(wallet, node_url, msigAccountPerm, proposerPerm, "try1", senderPerms);
test(wallet, node_url, msigAccountPerm, "try1", senderPerms);