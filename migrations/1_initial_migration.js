const TicketToken = artifacts.require("TicketToken");
const { ethers } = require("ethers");

let inputReader = require('readline-sync');
let licensePrice = inputReader.question("Digite o preço da licença em ETH: ");
let licenseSeed = inputReader.question("Digite a string que servirá de seed para a licença: ");

module.exports = function(deployer, network) {
  deployer.deploy(TicketToken, ethers.parseEther(licensePrice, 18), licenseSeed);
}