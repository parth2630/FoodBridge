import { ethers } from 'ethers';
import { db } from './firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

// Contract address and ABI
const CONTRACT_ADDRESS = '0x43dE567Fc443bC84fc98E8651bcf8C45dFb66d94';
const RECIPIENT_ADDRESS = '0x43dE567Fc443bC84fc98E8651bcf8C45dFb66d94';
const CONTRACT_ABI = [
  // Your contract ABI here
  "function recordDonation(string memory donorId, string memory donationId, uint256 amount, string memory foodType) public",
  "function verifyDonation(string memory donationId) public view returns (bool)",
  "function getDonationDetails(string memory donationId) public view returns (tuple(string memory donorId, uint256 amount, string memory foodType, uint256 timestamp))",
  "function sendDonation(uint256 amount) public payable",
  "function getDonationTransactions() public view returns (tuple(uint256 amount, uint256 timestamp, string memory status)[] memory)"
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
  }

  async connectWallet() {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.walletAddress = accounts[0];

      // Create provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // Create contract instance
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        this.signer
      );

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        this.walletAddress = accounts[0];
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async sendDonation(amountInWei) {
    try {
      if (!this.contract) {
        throw new Error('Wallet not connected');
      }

      // Send transaction to the fixed recipient address
      const tx = await this.signer.sendTransaction({
        to: RECIPIENT_ADDRESS,
        value: amountInWei
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Record transaction in Firestore
      await addDoc(collection(db, 'donations'), {
        transactionHash: receipt.transactionHash,
        amount: amountInWei.toString(),
        from: this.walletAddress,
        to: RECIPIENT_ADDRESS,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error sending donation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDonationTransactions() {
    try {
      if (!this.walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Query Firestore for transactions
      const donationsRef = collection(db, 'donations');
      const q = query(
        donationsRef,
        where('from', '==', this.walletAddress),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        timestamp: doc.data().timestamp,
        amount: doc.data().amount,
        status: doc.data().status,
        transactionHash: doc.data().transactionHash
      }));

      return {
        success: true,
        transactions
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async recordDonation(donationData) {
    try {
      const { donorId, donationId, quantity, foodType } = donationData;
      
      // Record donation on blockchain
      const tx = await this.contract.recordDonation(
        donorId,
        donationId,
        quantity,
        foodType
      );
      
      await tx.wait();
      
      // Update Firestore with blockchain transaction hash
      const donationRef = doc(db, 'donations', donationId);
      await updateDoc(donationRef, {
        blockchainId: tx.hash,
        blockchainStatus: 'verified',
        blockchainTimestamp: new Date().toISOString()
      });

      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('Error recording donation on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyDonation(donationId) {
    try {
      const isVerified = await this.contract.verifyDonation(donationId);
      return {
        success: true,
        isVerified
      };
    } catch (error) {
      console.error('Error verifying donation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDonationDetails(donationId) {
    try {
      const details = await this.contract.getDonationDetails(donationId);
      return {
        success: true,
        details: {
          donorId: details.donorId,
          amount: details.amount.toString(),
          foodType: details.foodType,
          timestamp: new Date(details.timestamp * 1000).toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting donation details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const blockchainService = new BlockchainService(); 