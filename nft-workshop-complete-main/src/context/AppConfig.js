import React, { useContext, useEffect, useState } from "react";
import Web3Modal from "web3modal";
import * as eth from "ethers";
import axios from "axios";
import { NFTStorage, Blob } from "nft.storage";
import { Contract } from "ethers";
import { abi } from "./utils";

export const BlockchainConfig = React.createContext();

export const BlockchainProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");

  const contr_addr = process.env.REACT_APP_CONTRACT;
  const NFT_STORAGE_TOKEN = process.env.REACT_APP_NFT_STORAGE_API_KEY;
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const provider = new eth.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new eth.Contract(contr_addr, abi, signer);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
    const accounts = await window.ethereum.request({
      //ethereum is a property that represents the Ethereum provider (like MetaMask)
      method: "eth_requestAccounts",
    });
    console.log("Connected");
    setCurrentAccount(accounts[0]);
    window.location.reload(); // ensures that other parts of the application are aware of the newly connected Ethereum account.
  };

  const checkIfWalletIsConnect = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length) {
      setCurrentAccount(accounts[0]);
      console.log("Connected");
    } else {
      console.log("No accounts found");
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      const metadata = await client.store({
        name: "ABC",
        description: "ABC",
        image: new File([`data:image/jpeg;base64,${file}`], "ai-image.jpg", { type: 'image/jpeg'}),
      });
      return metadata.data.image.href;
    } catch (error) {
      console.log("Error uploading to file");
    }
  };

  const createNFT = async (name, description, price, fileUrl) => {
    if (!name || !description || !fileUrl || !price) return;
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });
    let url = "";
    try {
      const metadata = new Blob([data]); // chunk of binary data
      const cid = await client.storeBlob(metadata);
      url = "https://ipfs.io/ipfs/" + cid;
      console.log(url);
      await createSale(url, price);
    } catch (error) {
      console.log("Error uploading to create nft", error);
    }
    return fileUrl;
  };

  const createSale = async (url, formInputPrice) => {
    const price = eth.utils.parseUnits(formInputPrice, "ether");
    console.log(price);
    try {
      const listingPrice = await contract.getListingPrice(); // fees charged by the marketplace to allow ppl upload the nft
      console.log("Listing price - ", listingPrice);
      const transaction = await contract.createToken(url, price, {
        value: listingPrice.toString(),
      });
      console.log(transaction);
      await transaction.wait();
      console.log(transaction);
    } catch (error) {
      console.log("An error occured at the create sale function - ", error);
    }
  };

  const fetchNFTs = async (setLoading) => {
    setLoading(true);
    const data = await contract.fetchMarketItems();
    const items = await Promise.all(
        data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
            const tokenURI = await contract.tokenURI(tokenId);

            console.log(tokenURI)

            const newtokenURI = tokenURI.replace("https://ipfs.io", "https://cloudflare-ipfs.com");

            const response = await axios.get(newtokenURI);
            const { image, name, description } = response.data;
            const price = eth.utils.formatUnits(
                unformattedPrice.toString(),
                "ether"
            );

            // Update image URL to use a CORS-enabled IPFS gateway
            const imageUrl = image.replace("https://ipfs.io", "https://cloudflare-ipfs.com");
            console.log(imageUrl);

            return {
                price,
                tokenId: tokenId.toNumber(),
                seller,
                owner,
                image: imageUrl,
                name,
                description,
                tokenURI,
            };
        })
    );
    return items;
};

  useEffect(() => {
    checkIfWalletIsConnect();
  }, []);
  return (
    <BlockchainConfig.Provider
      value={{
        fetchNFTs,
        uploadToIPFS,
        createNFT,
        createSale,
        currentAccount,
        checkIfWalletIsConnect,
        connectWallet,
      }}
    >
      {children}
    </BlockchainConfig.Provider>
  );
};
