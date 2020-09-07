const {
  eosio_msig
} = require("./config");

async function propose(api, proposer, proposalName, approvalList, tx, options) {
  let contract = await api.getContract(eosio_msig);
  let propose = await contract.propose(proposer, proposalName, approvalList, tx, options);
  console.log(propose);
  return propose;
}

async function approve(api, proposer, proposalName, permissionLevel, proposalHash, options) {
  let contract = await api.getContract(eosio_msig);
  let approve;
  if (proposalHash) {
    approve = await contract.approve(proposer, proposalName, permissionLevel, proposalHash, options);
  } else {
    approve = await contract.approve(proposer, proposalName, permissionLevel, options);
  }
  console.log(approve);
  return approve;
}

async function unapprove(api, proposer, proposalName, permissionLevel, options) {
  let contract = await api.getContract(eosio_msig);
  let unapprove = await contract.unapprove(proposer, proposalName, permissionLevel, permissionLevel, options);
  console.log(unapprove);
  return unapprove;
}

async function exec(api, proposer, proposalName, permissionLevel, options) {
  let contract = await api.getContract(eosio_msig);
  let exec = await contract.exec(proposer, proposalName, permissionLevel.actor, permissionLevel, options);
  console.log(exec);
  return exec;
}

async function cancel(api, proposer, proposalName, permissionLevel, options) {
  let contract = await api.getContract(eosio_msig);
  let cancel = await contract.cancel(proposer, proposalName, permissionLevel.actor, permissionLevel, options);
  console.log(cancel);
  return cancel;
}

async function invalidate(account, permissionLevel, options) {
  let contract = await api.getContract(eosio_msig);
  let invalidate = await contract.invalidate(account, permissionLevel.actor, permissionLevel, options);
  console.log(invalidate);
  return invalidate;
}

module.exports = {
  propose,
  approve,
  unapprove,
  exec,
  cancel,
  invalidate
};