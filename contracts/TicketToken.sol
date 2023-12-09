// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketToken {

    address public organizer;
    uint256 public eventDate;
    uint256 public refundPercentage = 75; // Percentagem a ser devolvida ao comprador
    uint256 public totalTicketsSold;
    uint256 public totalTicketsAvailable;
    uint256 public ticketPrice;

    mapping (uint256 => address) public ticketOwners;
    mapping (uint256 => bool) public ticketRedeemed;

    event TicketIssued(uint256 indexed ticketId, address indexed to, uint256 price);
    event TicketRedeemed(uint256 indexed ticketId, address indexed by);
    event TicketRefunded(uint256 indexed ticketId, address indexed to, uint256 refundAmount);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only the organizer can call this function");
        _;
    }

    constructor(uint256 _eventDate, uint256 _totalTickets, uint256 _ticketPrice) {
        organizer = msg.sender;
        eventDate = _eventDate;
        totalTicketsAvailable = _totalTickets;
        ticketPrice = _ticketPrice;
    }

    function issueTicket(uint256 _ticketId, address _to) external onlyOrganizer {
        require(totalTicketsSold < totalTicketsAvailable, "All tickets have been issued");
        require(ticketOwners[_ticketId] == address(0), "Ticket with this ID already issued");
        require(block.timestamp < eventDate, "Event date has already passed");

        ticketOwners[_ticketId] = _to;
        totalTicketsSold++;
        emit TicketIssued(_ticketId, _to, ticketPrice);
    }

    function purchaseTicket(uint256 _ticketId) external payable {
        require(totalTicketsSold < totalTicketsAvailable, "All tickets have been issued");
        require(ticketOwners[_ticketId] == address(0), "Ticket with this ID already issued");
        require(block.timestamp < eventDate, "Event date has already passed");
        require(msg.value >= ticketPrice, "Insufficient funds sent");

        // Emitir o ingresso para o comprador
        ticketOwners[_ticketId] = msg.sender;
        totalTicketsSold++;

        // Emitir o evento de compra do ingresso
        emit TicketIssued(_ticketId, msg.sender, msg.value);
    }

    function redeemTicket(uint256 _ticketId) external {
        require(msg.sender == ticketOwners[_ticketId], "You are not the owner of this ticket");
        require(!ticketRedeemed[_ticketId], "This ticket has already been redeemed");

        // Adicione lógica adicional para ações específicas do evento ao resgatar o ingresso

        // Marcar o ingresso como resgatado
        ticketRedeemed[_ticketId] = true;

        // Transferir Ether para o organizador (ou outra conta designada)
        payable(organizer).transfer(ticketPrice);

        // Emitir o evento de resgate do ingresso
        emit TicketRedeemed(_ticketId, msg.sender);
    }

    function refundUnusedTicket(uint256 _ticketId) external {
        require(msg.sender == ticketOwners[_ticketId], "You are not the owner of this ticket");
        require(!ticketRedeemed[_ticketId], "This ticket has already been redeemed");
        require(block.timestamp >= eventDate, "Event date has not passed yet");

        // Calcular o valor a ser devolvido ao comprador (75% do preço do ingresso)
        uint256 refundAmount = (ticketPrice * refundPercentage) / 100;

        // Transferir 75% do preço do ingresso ao comprador
        payable(msg.sender).transfer(refundAmount);

        // Transferir 25% do preço do ingresso ao organizador
        payable(organizer).transfer(ticketPrice - refundAmount);

        // Marcar o ingresso como resgatado
        ticketRedeemed[_ticketId] = true;

        // Emitir o evento de reembolso do ingresso
        emit TicketRefunded(_ticketId, msg.sender, refundAmount);
    }

    // Função para permitir que o organizador retire o saldo do contrato
    function withdrawBalance() external onlyOrganizer {
        payable(organizer).transfer(address(this).balance);
    }
}