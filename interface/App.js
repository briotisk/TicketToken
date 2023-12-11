import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, Button, FlatList } from 'react-native';
import { ethers } from 'ethers';
const ContractABI = require('../build/contracts/TicketToken.json');
const contractABI = ContractABI.abi;

export default function App() {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [readTicketID, setReadTicketID] = useState(false);
  const [showTickets_, setShowTickets] = useState(false);
  const [redeemTicket_, setRedeemTicket] = useState(false);
  const [refundUnusedTicket_, setRrefundUnusedTicket] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(null);
  const [texto, setTexto] = useState('');
  const [tickets, setTickets] = useState([]);

  const handleInputChange = (valor) => {
    setTexto(valor);
  };

  const handleRefundUnusedTicket = () => {
    setRrefundUnusedTicket(true);
    setReadTicketID(true);
  };

  const handleRedeemTicket = () => {
    setRedeemTicket(true);
    setReadTicketID(true);
  };

  const handleEnviar = () => {
    setReadTicketID(false);
    setTexto('');
    if (redeemTicket_) {
      redeemTicket(texto);
    } else if (refundUnusedTicket_) {
      refundUnusedTicket(texto);
    }
  };

  const contractAddress = '0xeEfB74577aB224585e45e61333f3545D9233C30f';

  async function showTickets() {

    setShowTickets(true);

    try {
      const metamaskProvider = new ethers.BrowserProvider(window.ethereum, 'any');
      const contract = new ethers.Contract(contractAddress, contractABI, metamaskProvider);
      const signer = await metamaskProvider.getSigner();
      const signerAddress = (await signer).getAddress();
      const signerAddressStr = (await signerAddress).toString();

      const blockInterval = 100;
      const fromBlock = 10187728;
      const toBlock = await metamaskProvider.getBlockNumber();

      let fromBlockAtual = fromBlock;
      let toBlockAtual = fromBlockAtual + blockInterval;

      const fetchedTickets = [];

      while (fromBlockAtual <= toBlock) {
        const TicketIssuedEvents = await contract.queryFilter(
          contract.filters.TicketIssued(),
          fromBlockAtual,
          toBlockAtual
        );

        for (const event of TicketIssuedEvents) {
          const ticketId = event.args.ticketId;
          const to = event.args.to;

          if (to === signerAddressStr) {
            fetchedTickets.push({ ticketId, to });
            console.log("ID do Ingresso:", ticketId.toString());
            console.log("Destinatário:", to);
            console.log("\n");
            
          }
        }

        fromBlockAtual += blockInterval;
        toBlockAtual += blockInterval;
      }

      setTickets(fetchedTickets);
    } catch (error) {
      console.error('Erro ao buscar e ler eventos:', error);
    }
  }
  async function checkMetaMaskInstalled() {

    // Verifica se a extensão ethereum está presente no window
    if (window.ethereum) {

     return true;

    } else {

      console.error('MetaMask não está instalado.');
      return false;

    }

  }

  async function connect() {
    try {
      // Verifica se o MetaMask está presente
      if (window.ethereum) {
        await window.ethereum.enable(); // Solicita permissão ao usuário para conectar o MetaMask
  
        // Cria um Signer a partir do MetaMask
        const provider = new ethers.BrowserProvider(window.ethereum, "any");
        const signer = provider.getSigner();
        
        //cria uma instância do contrato
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        // Tenta obter as contas do MetaMask
        const accounts = await provider.listAccounts();
  
        // Recarrega a aplicação no caso em que o usuário troca de rede 
        provider.on("network", (newNetwork, oldNetwork) => {
          if (oldNetwork) window.location.reload();
        });
  
        setIsConnected(true);

        const ticketPriceBigInt = await getTicketPrice();
        const formattedTicketPrice = ethers.formatUnits(ticketPriceBigInt, 'ether');
        setTicketPrice(formattedTicketPrice); 

      } else {
        console.error('MetaMask não está instalado.');
        setIsConnected(false);
      }
    } catch (error) {
      // Se o MetaMask não estiver instalado ou se o usuário não der permissão, será lançado um erro
      console.error('Erro ao acessar contas do MetaMask:', error.message);
      setIsConnected(false);
    }
  }

async function getTicketPrice() {

  try {
    const metamaskProvider = new ethers.BrowserProvider(window.ethereum, "any");
    //const signer = await metamaskProvider.getSigner();
    
    // Crie uma instância do contrato usando o Signer da MetaMask
    const contract = new ethers.Contract(contractAddress, contractABI, metamaskProvider);

    // Obtém o valor da variável pública "ticketPrice"
    const price = await contract.ticketPrice();

    return price;

  } catch (error) {

    alert('Erro ao consultar o preço do ingresso. Tente recarregar a página.');

  }

}

async function refundUnusedTicket(ticketID) {

  setRrefundUnusedTicket(false);

  try {

    const ticketIDInt = +ticketID;

    const metamaskProvider = new ethers.BrowserProvider(window.ethereum, "any");
    const signer = await metamaskProvider.getSigner();
  
    // Crie uma instância do contrato usando o Signer da MetaMask
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const signerAddress = (await signer).getAddress();
  
    const tx = await contract.refundUnusedTicket(ticketIDInt);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      alert("Transação bem-sucedida: O ingresso foi resgatado com sucesso! Boa Festa!");
    }
  
  } catch (error) {

    if(error.message.indexOf("This ticket has already been redeemed") != -1 ){

      alert('Erro ao enviar a transação: Parece que você já resgatou esse ingresso = )');
      console.log(error.message);

    }else if(error.message.indexOf("You are not the owner of this ticket") != -1){

      alert('Erro ao enviar a transação: Parece que você não é o dono desse ingresso = (');
      console.log(error.message);

    }else if(error.message.indexOf("Event date has not passed yet") != -1){

      alert('Erro ao enviar a transação: O reembolso só pode ser solicitado após a data do evento = )');
      console.log(error.message);

    }else{

      alert('Falha ao enviar transação X (');

    }

  }
}

async function redeemTicket(ticketID) {

  setRedeemTicket(false);

  try {

    const ticketIDInt = +ticketID;

    const metamaskProvider = new ethers.BrowserProvider(window.ethereum, "any");
    const signer = await metamaskProvider.getSigner();
  
    // Crie uma instância do contrato usando o Signer da MetaMask
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const signerAddress = (await signer).getAddress();
  
    const tx = await contract.redeemTicket(ticketIDInt);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      alert("Transação bem-sucedida: O ingresso foi resgatado com sucesso! Boa Festa!");
    }
  
  } catch (error) {

    if(error.message.indexOf("This ticket has already been redeemed") != -1 ){

      alert('Erro ao enviar a transação: Parece que você já resgatou esse ingresso = )');
      console.log(error.message);

    }else if(error.message.indexOf("All tickets have been issued") != -1){
      
      alert('Parece que os ingressos se esgotaram = (');
      console.log(error.message);

    }else{

      alert('Falha ao enviar transação X (');

    }
    
  }

}

async function purchaseTicket() {

  try {
    const metamaskProvider = new ethers.BrowserProvider(window.ethereum, "any");
    const signer = await metamaskProvider.getSigner();
  
    // Crie uma instância do contrato usando o Signer da MetaMask
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const signerAddress = (await signer).getAddress();

    const ticketPriceBigInt = await getTicketPrice();

    const tx = await contract.purchaseTicket({from: signerAddress, value: ticketPriceBigInt});
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      alert("Transação bem-sucedida: O ingresso foi adquirido com sucesso!");
    }
  
  } catch (error) {

    if(error.message.indexOf("insufficient funds") != -1 ){

      alert('Erro ao enviar a transação: Parece que você não tem fundos suficientes = (');
      console.log(error.message);

    }else{

      alert('Falha ao enviar transação X (');

    }
    
  }

}
  useEffect(() => {

    async function checkMetaMask() {

      try {

        // Chamada da função que verifica o MetaMask
        const installed = await checkMetaMaskInstalled();
        
        // Atualiza o estado com base no resultado da verificação
        setIsMetaMaskInstalled(installed);

      } catch (error) {

        console.error('Erro ao verificar o MetaMask:', error.message);

      }

    }

    // Chamada da função de verificação ao iniciar o componente
    checkMetaMask();

  }, []); // O array vazio [] assegura que o efeito só seja executado uma vez, sem depender de variáveis de estado


  return (

   <View style={styles.container}>

      {isMetaMaskInstalled && !isConnected &&(
        <View style={styles.metaMaskView}>
          <Text style={styles.metaMaskText}>Seja Bem-Vindo!</Text>
          <Text style={styles.metaMaskText}>Conecte-se para continuar.</Text>
          <Button
            onPress={connect}
            title="Conectar"
            color="#8da8ff"
          />
        </View>
      )}
 
      {!isMetaMaskInstalled && (
        <View style={styles.metaMaskView}>
          <Text style={styles.metaMaskText}>:(</Text>
          <Text style={styles.metaMaskText}>Parece que você não possui a Metamask instalada...</Text>
          <Text style={styles.metaMaskText}>Instale para continuar!</Text>
        </View>
      )}

      {isConnected && !readTicketID &&(
        <View style={styles.metaMaskText}>
          <Text style={styles.metaMaskText}>O que deseja fazer?</Text>
        </View>
      )}

      {isConnected && !readTicketID &&(
        <View style={styles.row}>
          <Button
            onPress={purchaseTicket}
            title="Comprar Ingresso"
            color="#8da8ff"
          />
          <View style={styles.horizontalMargin} />
          <Button
            onPress={handleRedeemTicket}
            title="Resgatar Ingresso"
            color="#8da8ff"
          />
          <View style={styles.horizontalMargin} />
          <Button
            onPress={handleRefundUnusedTicket}
            title="Obter Reembolso"
            color="#8da8ff"
          />
          <View style={styles.horizontalMargin} />
          <Button
            onPress={showTickets}
            title="Ver Meus Ingressos"
            color="#8da8ff"
          />
        </View>
      )}

      {isConnected && readTicketID &&( 
        <View>
          <TextInput
            placeholder="Digite o ID do ingresso"
            value={texto}
            onChangeText={handleInputChange}
            style={{ borderBottomWidth: 1, marginBottom: 15, padding: 8,  color: '#fff'}}
          />
          <Button title="Enviar" onPress={handleEnviar} />
        </View>
      )}

      {isConnected &&(
        <View style={styles.metaMaskText}>
          <Text style={styles.metaMaskText}>Preço do ingresso: {ticketPrice !== null ? `${ticketPrice} ETH` : 'Carregando...'}</Text>
        </View>
      )}

      {isConnected && readTicketID && (
        <View>
          <TextInput
            placeholder="Digite o ID do ingresso"
            value={texto}
            onChangeText={handleInputChange}
            style={{ borderBottomWidth: 1, marginBottom: 15, padding: 8, color: '#fff' }}
          />
          <Button title="Enviar" onPress={handleEnviar} />
        </View>
      )}

      {isConnected && showTickets_ &&(
        <View>
          <Text style={styles.metaMaskText}>Ingressos:</Text>
          <FlatList
            data={tickets}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.ticketItem}>
                <Text>ID do Ingresso: {item.ticketId.toString()}</Text>
              </View>
            )}
          />
        </View>
      )}

    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaMaskView: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 5,
  },
  metaMaskText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 10,
  },
  horizontalMargin: {
    marginHorizontal: 10,
  },
  ticketItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});