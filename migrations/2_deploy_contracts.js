var CryptPad  = artifacts.require("CryptPad.sol");

module.exports = function(deployer) {
  deployer.deploy(CryptPad);
};
