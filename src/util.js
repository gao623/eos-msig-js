async function packTransaction(api, trans, options) {
  let blocksBehind = options.blocksBehind || 30;
  let expireSeconds = options.expireSeconds || 3000;
  let broadcast = options.broadcast || false;
  let sign = options.sign || false;

  console.log("packTransaction", trans);

  /* eos.transact only support promise */
  let packTx = await api.transact(trans, {
    expireSeconds: expireSeconds,
    blocksBehind: blocksBehind,
    broadcast: broadcast,
    sign: sign
  });
  if (packTx && packTx.error) {
    throw packTx.error;
  }
  return packTx;
}

async function getRequestApproveList(client, accountPerm) {
  let msigAccount = await client.rpc.get_account(accountPerm.actor);
  let multiActivePerm = msigAccount.permissions.filter(item => {
    if (accountPerm.parentPermission) {
      return item.perm_name == accountPerm.permission && item.parent == accountPerm.parentPermission;
    }
    return item.perm_name == accountPerm.permission;
  });

  let activeList = multiActivePerm[0];
  if (!activeList) {
    throw new Error(`invalid account ${accountPerm}`);
  }
  let accountList = activeList.required_auth.accounts.map(item => item.permission);
  // // 不关心key
  // let keyAccountQuery = activeList.required_auth.keys.map((item) => {
  //   return client.rpc.history_get_key_accounts(item.key);
  //   // return {
  //   //   key:item.key,
  //   //   permission: "active"
  //   // }
  // });
  // let keyAccount = await Promise.all(keyAccountQuery);
  // let keyList = keyAccount[0].map(item => {
  //   return {
  //     actor: item,
  //     permission: "active"
  //   }
  // })
  // console.log(keyList);
  // let approveList = accountList.concat(keyList);
  let approveList = accountList;
  return approveList;
}

async function getRequiredAuth(client, accountPerm) {
  let msigAccount = await client.rpc.get_account(accountPerm.actor);
  let multiActivePerm = msigAccount.permissions.filter(item => {
    if (accountPerm.parentPermission) {
      return item.perm_name == accountPerm.permission && item.parent == accountPerm.parentPermission;
    }
    return item.perm_name == accountPerm.permission;
  });

  let activeList = multiActivePerm[0];
  if (!activeList) {
    throw new Error(`invalid account ${accountPerm}`);
  }
  // let accountList = activeList.required_auth.accounts.map(item => item.permission);
  let accountList = activeList.required_auth;
  // // 不关心key
  // let keyAccountQuery = activeList.required_auth.keys.map((item) => {
  //   return client.rpc.history_get_key_accounts(item.key);
  //   // return {
  //   //   key:item.key,
  //   //   permission: "active"
  //   // }
  // });
  // let keyAccount = await Promise.all(keyAccountQuery);
  // let keyList = keyAccount[0].map(item => {
  //   return {
  //     actor: item,
  //     permission: "active"
  //   }
  // })
  // console.log(keyList);
  // let approveList = accountList.concat(keyList);
  let approveList = accountList;
  return approveList;
}

function sleep(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  })
}

function deepArrayFlatten(arr) {
  return [].concat(...arr.map(v=>Array.isArray(v)?deepArrayFlatten(v) : v));
}

function newClient(nodeUrl, privateKeys) {
  const EOS = require("eosjs");
  const util = require("util"); 
  const fetch = require('node-fetch');
  const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

  let rpc = new EOS.JsonRpc(nodeUrl, {fetch: fetch});
  let client;
  if (privateKeys && privateKeys.length) {
    client = new EOS.Api({
      rpc: rpc,
      authorityProvider: rpc,
      signatureProvider: new JsSignatureProvider(privateKeys),
      abiProvider: rpc,
      textEncoder: new util.TextEncoder(),
      textDecoder: new util.TextDecoder()
    });
  } else {
    client = new EOS.Api({
      rpc: rpc,
      authorityProvider: rpc,
      abiProvider: rpc,
      textEncoder: new util.TextEncoder(),
      textDecoder: new util.TextDecoder()
    });
  }

  return client;
}

exports.packTransaction = packTransaction;
exports.getRequestApproveList = getRequestApproveList;
exports.getRequiredAuth = getRequiredAuth;
exports.sleep = sleep;
exports.deepArrayFlatten = deepArrayFlatten;
exports.newClient = newClient;