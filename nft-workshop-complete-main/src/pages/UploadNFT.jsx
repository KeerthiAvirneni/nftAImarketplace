import React, {
  useState,
  useMemo,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { useDropzone } from "react-dropzone";
import { BlockchainConfig } from "../context/AppConfig";
import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer";
import axios from "axios";

export const UploadNFT = () => {
  const [fileUrl, setFileUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState();

  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragLoad, setDragLoad] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const { uploadToIPFS, createNFT, currentAccount, connectWallet } =
    useContext(BlockchainConfig);

  const handleCreation = async () => {
    setUploadLoading(true);
    setDragLoad(true);
    const file = await createImage();
    const url = await uploadToIPFS(file);
    console.log({ url });
    setDragLoad(false);
    const fileURL = url.replace("ipfs://", "https://ipfs.io/ipfs/");

    console.log(fileURL)

    const urlReturned = await createNFT(name, description, price, fileURL);

    console.log(urlReturned);
    setName("");
    setDescription("");
    setPrice("");
    setUploadLoading(false);
  };

  const createImage = async () => {
    setMessage("Generating Image...");

    // You can replace this with different model API's
    const URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2";
    try {
    // Send the request
    const response = await axios({
      url: URL,
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        inputs: description,
        options: { wait_for_model: true },
      }),
      responseType: "arraybuffer",
    });

    const type = response.headers["content-type"];
    const data = response.data;

    console.log(data);

    const base64data = Buffer.from(data).toString('base64');

    console.log(base64data);

        return base64data;
        

    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};


    const type = response.headers["content-type"];
    const data = response.data;

    console.log(data);

    const base64data = Buffer.from(data).toString('base64');

    console.log(base64data);

        return base64data;
        

    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    };
  };


  return (
    <div>
      <div className="mininav flex justify-between">
        <button
          onClick={() => connectWallet()}
          className="text-white mx-3 mt-2 p-2 rounded-md border-2 hover:bg-white hover:text-black transition-all ease-in-out"
        >
          {currentAccount ? "Connected" : "Connect to Web3"}
        </button>
        <button
          disabled={!currentAccount}
          onClick={() => navigate("/market")}
          className="text-white mx-3 mt-2 p-2 rounded-md border-2 hover:bg-white hover:text-black transition-all ease-in-out"
        >
          Go to Market
        </button>
      </div>
      <div className="flex flex-col justify-center items-center mt-10">
        <h1 className="text-white text-6xl font-extrabold shadow-md shadow-red-400 px-2 py-1">
          CREATE YOUR NFT!
        </h1>
        <div className="mt-16">
          <p className="font-poppins dark:text-white font-semibold text-xl animate-bounce">
            Upload files
          </p>

          <img src={image} alt="" />
          <div className="mt-12 mb-10">
            <div className="flexCenter flex-col text-center">
              <p className="text-white font-semibold text-sm">
                {dragLoad ? "Uploading to IPFS.." : "Enter AI image prompt"}
              </p>
            </div>

            {fileUrl && (
              <div className="my-4">
                <img src={fileUrl} alt="asset_file" className="w-52 m-auto" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            title="Name"
            placeholder="NFT Name"
            className="px-4 py-2 rounded-lg"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="textarea"
            placeholder="Description of your NFT"
            className="px-4 py-2 rounded-lg"
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="number"
            placeholder="Enter Price"
            className="px-4 py-2 rounded-lg"
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="mt-7 w-full flex justify-center mb-10">
          {uploadLoading ? (
            <div className="text-white">Loading.....</div>
          ) : name && description && price ? (
            <button
              btnName="Create NFT"
              className="rounded-xl bg-white p-3 "
              onClick={handleCreation}
            >
              Create NFT
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};