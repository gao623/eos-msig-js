const {
  eosio_msig
} = require("./config");

function createProposeData(proposer, proposalName, approvalList, tx, senderPerm) {
  return {
    actions: [{
      account: eosio_msig,
      name: "propose",
      authorization: [{
        actor: senderPerm.actor,
        permission: senderPerm.permission,
      }],
      data: {
        proposer: proposer,
        proposal_name: proposalName,
        requested: approvalList,
        trx: tx,
      },
    }]
  };
}

function createApproveData(proposer, proposalName, proposalHash, senderPerm) {
  let data = {
    proposer: proposer,
    proposal_name: proposalName,
    level: senderPerm,
  };
  if (proposalHash) {
    data.proposal_hash = proposalHash;
  }
  return {
    actions: [{
      account: eosio_msig,
      name: "approve",
      authorization: [{
        actor: senderPerm.actor,
        permission: senderPerm.permission,
      }],
      data: data
    }]
  };
}

function createUnapproveData(proposer, proposalName, senderPerm) {
  return {
    actions: [{
      account: eosio_msig,
      name: "unapprove",
      authorization: [{
        actor: senderPerm.actor,
        permission: senderPerm.permission,
      }],
      data: {
        proposer: proposer,
        proposal_name: proposalName,
        level: senderPerm,
      },
    }]
  };
}

function createExecData(proposer, proposalName, senderPerm) {
  return {
    actions: [{
      account: eosio_msig,
      name: "exec",
      authorization: [{
        actor: senderPerm.actor,
        permission: senderPerm.permission,
      }],
      data: {
        proposer: proposer,
        proposal_name: proposalName,
        executer: senderPerm.actor,
      },
    }]
  };
}

function createCancelData(proposer, proposalName, senderPerm) {
  return {
    actions: [{
      account: eosio_msig,
      name: "cancel",
      authorization: [{
        actor: senderPerm.actor,
        permission: senderPerm.permission,
      }],
      data: {
        proposer: proposer,
        proposal_name: proposalName,
        canceler: senderPerm.actor,
      },
    }]
  };
}

function createInvalidateData(senderPerm) {
  return {
    actions: [{
      account: eosio_msig,
      name: "invalidate",
      authorization: [{
        actor: senderPerm.actor,
        permission: senderPerm.permission,
      }],
      data: {
        account: senderPerm.actor
      },
    }]
  };
}

module.exports = {
  createProposeData,
  createApproveData,
  createUnapproveData,
  createExecData,
  createCancelData,
  createInvalidateData
};