import Web3 from 'web3';
import { db } from './firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';

// Smart Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "donationId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "donor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "ngo",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "foodType",
        "type": "string"
      }
    ],
    "name": "DonationCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "donationId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "status",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DonationStatusUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "ngo",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "foodType",
        "type": "string"
      }
    ],
    "name": "createDonation",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "donationId",
        "type": "bytes32"
      }
    ],
    "name": "getDonation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "donor",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "ngo",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "quantity",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "foodType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "status",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct FoodDonation.Donation",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "donationId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "status",
        "type": "string"
      }
    ],
    "name": "updateDonationStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Contract address (replace with your deployed contract address)
const CONTRACT_ADDRESS = process.env.REACT_APP_SMART_CONTRACT_ADDRESS;

class BlockchainService {
  constructor() {
    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    } else {
      console.warn('Please install MetaMask to use blockchain features');
    }
  }

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await this.web3.eth.getAccounts();
      return accounts[0];
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }

  async createDonation(donationData) {
    try {
      const account = await this.connectWallet();
      
      // Create donation on blockchain
      const result = await this.contract.methods.createDonation(
        donationData.ngoAddress,
        this.web3.utils.toWei(donationData.quantity.toString(), 'ether'),
        donationData.foodType
      ).send({ from: account });

      const donationId = result.events.DonationCreated.returnValues.donationId;

      // Update Firestore with blockchain reference
      await updateDoc(doc(db, 'donations', donationData.id), {
        blockchainId: donationId,
        blockchainTxHash: result.transactionHash,
        blockchainTimestamp: new Date(),
      });

      // Add to blockchain transactions collection
      await addDoc(collection(db, 'blockchainTransactions'), {
        donationId: donationData.id,
        blockchainId: donationId,
        txHash: result.transactionHash,
        event: 'DonationCreated',
        timestamp: new Date(),
        data: result.events.DonationCreated.returnValues,
      });

      return {
        blockchainId: donationId,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Error creating donation on blockchain:', error);
      throw error;
    }
  }

  async updateDonationStatus(blockchainId, status) {
    try {
      const account = await this.connectWallet();
      
      const result = await this.contract.methods.updateDonationStatus(
        blockchainId,
        status
      ).send({ from: account });

      // Add status update to blockchain transactions
      await addDoc(collection(db, 'blockchainTransactions'), {
        blockchainId,
        txHash: result.transactionHash,
        event: 'DonationStatusUpdated',
        timestamp: new Date(),
        data: result.events.DonationStatusUpdated.returnValues,
      });

      return result.transactionHash;
    } catch (error) {
      console.error('Error updating donation status on blockchain:', error);
      throw error;
    }
  }

  async getDonationHistory(blockchainId) {
    try {
      // Get donation details from smart contract
      const donation = await this.contract.methods.getDonation(blockchainId).call();

      // Get all blockchain transactions for this donation
      const transactions = [];
      const events = await this.contract.getPastEvents('allEvents', {
        filter: { donationId: blockchainId },
        fromBlock: 0,
        toBlock: 'latest'
      });

      events.forEach(event => {
        transactions.push({
          event: event.event,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date(event.returnValues.timestamp * 1000),
          data: event.returnValues
        });
      });

      return {
        donation,
        transactions: transactions.sort((a, b) => a.blockNumber - b.blockNumber)
      };
    } catch (error) {
      console.error('Error getting donation history:', error);
      throw error;
    }
  }

  // Verify donation integrity
  async verifyDonation(blockchainId, firestoreData) {
    try {
      const { donation } = await this.getDonationHistory(blockchainId);
      
      // Compare blockchain data with Firestore data
      const verified = {
        quantity: this.web3.utils.fromWei(donation.quantity, 'ether') === firestoreData.quantity.toString(),
        foodType: donation.foodType === firestoreData.foodType,
        status: donation.status === firestoreData.status,
        donor: donation.donor.toLowerCase() === firestoreData.donorAddress.toLowerCase(),
        ngo: donation.ngo.toLowerCase() === firestoreData.ngoAddress.toLowerCase(),
      };

      return {
        isVerified: Object.values(verified).every(v => v),
        details: verified,
      };
    } catch (error) {
      console.error('Error verifying donation:', error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService(); 