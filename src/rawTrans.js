const actions = require("./actions");
const util = require("./util");

function createProposeTrans(api, proposalName, approvalList, tx, senderPerm, options) {
  if (!options) {
    options = {};
  }
  let data = actions.createProposeData(senderPerm.actor, proposalName, approvalList, tx, senderPerm);
  console.log("createProposeTrans", JSON.stringify(data));
  return util.packTransaction(api, data, options);
}

function createApproveTrans(api, proposer, proposalName, proposalHash, senderPerm, options) {
  if (!options) {
    options = {};
  }
  let data = actions.createApproveData(proposer, proposalName, proposalHash, senderPerm);
  console.log("createApproveTrans", JSON.stringify(data));
  return util.packTransaction(api, data, options);
}

function createUnapproveTrans(api, proposer, proposalName, senderPerm, options) {
  if (!options) {
    options = {};
  }
  let data = actions.createUnapproveData(proposer, proposalName, senderPerm);
  return util.packTransaction(api, data, options);
}

function createExecTrans(api, proposer, proposalName, senderPerm, options) {
  if (!options) {
    options = {};
  }
  let data = actions.createExecData(proposer, proposalName, senderPerm);
  console.log("createExecTrans", JSON.stringify(data));
  return util.packTransaction(api, data, options);
}

function createCancelTrans(api, proposer, proposalName, senderPerm, options) {
  if (!options) {
    options = {};
  }
  let data = actions.createCancelData(proposer, proposalName, senderPerm);
  console.log("createCancelTrans", JSON.stringify(data));
  return util.packTransaction(api, data, options);
}

function createInvalidateTrans(api, senderPerm, options) {
  if (!options) {
    options = {};
  }
  let data = actions.createInvalidateData(senderPerm);
  return util.packTransaction(api, data, options);
}

module.exports = {
  createProposeTrans,
  createApproveTrans,
  createUnapproveTrans,
  createExecTrans,
  createCancelTrans,
  createInvalidateTrans
};