const pu = require('promisefy-util');
const keosdjs = require("keosdjs");

const msig = require("../index");
const util = require("../src/util");
const {
  eosio_msig
} = require("../src/config");

const keosd = new keosdjs({
  endpoint:"http://192.168.47.159:9999"
});

async function test(wallet, url, msigAccountPerm, proposalName, senderPerm) {
  let client = util.newClient(url, wallet.privateKeys);
  let accountApproveList = await util.getRequestApproveList(client, msigAccountPerm);
  let accountRequiredAuth = await util.getRequiredAuth(client, msigAccountPerm);
  console.log("approveList", accountApproveList);
  console.log("accountRequiredAuth", accountRequiredAuth);

  let accountWeight = {
    threshold: accountRequiredAuth.threshold
  };
  for (let accountPerm of accountRequiredAuth.accounts) {
    accountWeight[accountPerm.permission.actor] = accountPerm.weight;
  }

  let approveListQuery = accountApproveList.map(async (item) => {
    let tableRows = await client.rpc.get_table_rows({
      code: eosio_msig,
      scope: item.actor,
      table: "approvals",
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
  approveListQuery = approveListQuery.concat(accountApproveList.map(async (item) => {
    let tableRows = await client.rpc.get_table_rows({
      code: eosio_msig,
      scope: item.actor,
      table: "approvals2",
      lower_bound: proposalName,
      upper_bound: proposalName,
      index_position: 1
    });
    console.log(item.actor, proposalName, tableRows);
    return {
      proposer: item.actor,
      rows: tableRows.rows
    };
  }));

  let approveListResult = await Promise.all(approveListQuery);
  let approveListRows = util.deepArrayFlatten(approveListResult);
  console.log("tableRows", approveListRows);

  for (let approveRows of approveListRows) {
    if (!approveRows.rows.length) {
      continue;
    }
    let providedWeight = 0;
    for (let currApprove of approveRows.rows) {
      // propose approve weight
      for (let providedApprovals of currApprove.provided_approvals) {
        providedWeight += accountWeight[providedApprovals.actor];
      }
      if (providedWeight < accountWeight.threshold) {
        continue;
      }

      let signedTx;
      if (wallet.privateKeys) {
        console.log("privateKeys")
        signedTx = await msig.rawTrans.createExecTrans(client, approveRows.proposer, currApprove.proposal_name, senderPerm, {sign: true});
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
    
        let pubKeys = await pu.promisefy(keosd.get_public_keys, [], keosd);
        console.log("public keys", pubKeys);
        let execTx = await msig.rawTrans.createExecTrans(client, approveRows.proposer, currApprove.proposal_name, senderPerm);
        let execJSONTx = await client.deserializeTransaction(execTx.serializedTransaction);
        console.log("execJSONTx", execJSONTx);
    
        let requireKeys = await client.rpc.getRequiredKeys({transaction: execJSONTx, availableKeys: pubKeys});
        console.log("getRequiredKeys:", requireKeys);
    
        let info = await client.rpc.get_info();
        let chainId = info.chain_id;
    
        let signTrans = await pu.promisefy(keosd.sign_transaction, [execJSONTx, requireKeys, chainId], keosd);
    
        signedTx = {};
        signedTx.signatures = signTrans.signatures;
        signedTx.serializedTransaction = execTx.serializedTransaction; // await client.serializeTransaction(execTx);
    
      }
      console.log("signedTx", signedTx);
      let result = await client.pushSignedTransaction(signedTx);
      console.log("execTx", JSON.stringify(result));
    }
  }
}

const node_url = "https://jungle3.cryptolions.io:443";

const wallet = {
  name:"multisig",
  // passwd:"PW5JARiVYiNV226pYhhG6ULs7UXU31UsFX1LjUWjKFWYQfkBDTDq8"// 58
  passwd:"PW5Jh1B6x2VaEEK3vEhN8igmAZeAZvdTAswYRch3ePTtWJiKady3K"
};
// const wallet = {
//   privateKeys:process.env.EOS_KEYS
// };
// const wallet = {
//   privateKeys:[
//     "5JpABcR3r1zwwGLUhZ6oykpZhoMRorUE9jCEErcLRHYVfY3Y4C6", // EOS89MiYBW3r2V5GJVbazsSyENZspV3t7fK82sNEN2DhgzmXVWx9x
//     "5JyyPpjBXYBRDz4g9wT3VFPvU9p9whyWSghEia1D5b7owgn47nP", // EOS5FtHtHZeHgnCugyxgsKMWDVXYoUbZFajMZX4SR45GABnwWfgng
//     "5JMrg3FpW8KHteh3amSvkm9k3dfvYyEhWqNe3MhR4bQFLZqQQ1C", // EOS6vZYjUbEYWp1fKMqGkeLCJhtaSfJ6k2sHkzEeYxBJE6aSWVAJ2
//     "5JU9uiA2r5cJtbvErWkKGvb77Y4xd6H5UfP5XhHGsBCk8wwaYCJ", // EOS6RKD7WaXD3oPpoj3ki1LqmhYYwVZfH7XkDXXwcKR1nTYKHZEcS
//     "5K1csZUYhnJtrDcGACXGP4dASFZVi8NjbjnXSaw3c8nxrToLPcy", // EOS6ztBxqYoZkC2qfqqukv3FVs3nBnaeswuoed1sHEF9sUzQu6v8p
//   ]
// };

const senderPerm = {
  actor: "3edcwertdfgh",
  permission: "active"
};

const msigAccountPerm = {
  actor: "okmijnuhbygv",
  permission: "active",
  parentPermission: "owner"
}

test(wallet, node_url, msigAccountPerm, "try1", senderPerm);