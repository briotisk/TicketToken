const TicketToken = artifacts.require("TicketToken");
const { ethers } = require("ethers");
const moment = require('moment');

function isValidDateTime(input) {
  const dateTimeRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;

  // Testa se a entrada corresponde ao formato esperado
  if (!dateTimeRegex.test(input)) {
    return false;
  }

  // Verifica se a data é válida usando o Moment.js ou outra biblioteca de manipulação de datas
  const moment = require('moment');
  const parsedDate = moment(input, 'DD/MM/YYYY HH:mm', true);

  return parsedDate.isValid();
}

let inputReader = require('readline-sync');
let ticketPrice = inputReader.question("Digite o preço do ingresso em ETH (use '.' como separador decimal): ");
let eventDate = inputReader.question("Digite a data do evento (formato DD/MM/YYYY HH:mm): ");
while(!isValidDateTime(eventDate)){
  eventDate = inputReader.question("Digite a data do evento (formato DD/MM/YYYY HH:mm): ");
}
let totalTicketsAvailable = inputReader.question("Digite o número de ingressos a serem disponibilizados: ");

// Use o Moment.js para converter para timestamp
const eventTimestamp = moment(eventDate, 'DD/MM/YYYY HH:mm').unix();

module.exports = function(deployer, network) {
  deployer.deploy(eventDate, totalTicketsAvailable, ethers.parseEther(ticketPrice, 18));
}