import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { ethers } from 'ethers';
const ContractABI = require('../../build/contracts/TicketToken.json');
const contractABI = ContractABI.abi;

export default function App() {

  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const contractAddress = "";//colocar o endereço do contrato obtido no deploy

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
  
        // Tenta obter as contas do MetaMask
        const accounts = await provider.listAccounts();
  
        // Recarrega a aplicação no caso em que o usuário troca de rede 
        provider.on("network", (newNetwork, oldNetwork) => {
          if (oldNetwork) window.location.reload();
        });
  
        setIsConnected(true);
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

  async function purchaseLicense() {

    try {
      const metamaskProvider = new ethers.BrowserProvider(window.ethereum, "any");
      const signer = await metamaskProvider.getSigner();
    
      // Crie uma instância do contrato usando o Signer da MetaMask
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const signerAddress = (await signer).getAddress();
    
      const tx = await contract.purchaseLicense({from: signerAddress, value: licensePrice});
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        alert("Transação bem-sucedida: A licença foi adquirida com sucesso!");
      }
    
    } catch (error) {

      if(error.message.substr(0, 18) ==  "insufficient funds"){

        alert('Erro ao enviar a transação: Parece que você não tem fundos suficientes = (');

      }else if(error.message.substr(0, 18) ==  "execution reverted"){

        alert('Erro ao enviar a transação: Parece que você já possui a licença = )');

      }
      
    }

  }

  async function printLicense() {

    try {
      const metamaskProvider = new ethers.BrowserProvider(window.ethereum, "any");
      const signer = await metamaskProvider.getSigner();
      
      // Crie uma instância do contrato usando o Signer da MetaMask
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Chamar a função printSoftwareKey
      const key = await contract.printSoftwareKey();

      console.log("Chave de software:", key);
      alert("Chave de software: " + key);
    } catch (error) {

      if(error.message.substr(0, 18) ==  "insufficient funds"){

        alert('Erro ao enviar a transação: Parece que você não tem fundos suficientes = (');

      }else if(error.message.substr(0, 18) ==  "execution reverted"){

        alert('Erro ao enviar a transação: Você precisa ter comprado a licença antes = (');

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
          <Text style={styles.metaMaskText}>Conecte-se para continuar!</Text>
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

      {isConnected &&(
        <View style={styles.metaMaskText}>
          <Text style={styles.metaMaskText}>O que deseja fazer?</Text>
        </View>
      )}

      {isConnected &&(
        <View style={styles.row}>
          <Button
            onPress={purchaseLicense}
            title="Comprar Licença"
            color="#8da8ff"
          />
          <View style={styles.horizontalMargin} />
          <Button
            onPress={printLicense}
            title="Imprimir Licença"
            color="#8da8ff"
          />
        </View>
      )}

      {isConnected &&(
        <View style={styles.metaMaskText}>
          <Text style={styles.metaMaskText}>Preço da licença: 0.02 ETH</Text>
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
});