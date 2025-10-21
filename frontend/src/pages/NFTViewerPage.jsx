import React, { useState } from "react";
import { ethers } from "ethers";
import {
  Award,
  Search,
  ExternalLink,
  Shield,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";

const NFTCertificateViewer = () => {
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [nft, setNft] = useState(null);
  const [error, setError] = useState("");

  const CONTRACT_ADDRESS = "0x2F6D5838A287EE67AB999dC6728FbA738A908b4B";
  const RPC_URL = "https://dream-rpc.somnia.network";

  const fetchNFT = async () => {
    if (!tokenId) {
      setError("Please enter a token ID");
      return;
    }

    setLoading(true);
    setError("");
    setNft(null);

    try {
      const response = await fetch(`http://localhost:5000/api/nft/${tokenId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setNft(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch NFT");
    } finally {
      setLoading(false);
    }
  };
  const getAttribute = (name) => {
    return nft?.attributes?.find((attr) => attr.trait_type === name)?.value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">
              NFT Certificate Viewer
            </h1>
          </div>
          <p className="text-gray-400">
            View Lizard Academy Certificate of Competency NFTs
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Enter Token ID (e.g., 1, 2, 3...)"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchNFT()}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchNFT}
              disabled={loading}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-xl font-semibold flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  View NFT
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* NFT Display */}
        {nft && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="space-y-4">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full rounded-xl border-4 border-blue-500/50 shadow-2xl"
                />
                <div className="flex gap-2">
                  <a
                    href={nft.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-center flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Image
                  </a>
                  <a
                    href={nft.metadataURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-center flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Metadata
                  </a>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {nft.name}
                  </h2>
                  <p className="text-gray-300">{nft.description}</p>
                </div>

                {/* Attributes */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Certificate Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard
                      icon={<Award className="w-4 h-4" />}
                      label="Certificate #"
                      value={getAttribute("Certificate Number")}
                    />
                    <InfoCard
                      icon={<User className="w-4 h-4" />}
                      label="Student"
                      value={getAttribute("Student")}
                    />
                    <InfoCard
                      icon={<BookOpen className="w-4 h-4" />}
                      label="Certification"
                      value={getAttribute("Certification")}
                    />
                    <InfoCard
                      icon={<Award className="w-4 h-4" />}
                      label="Category"
                      value={getAttribute("Category")}
                    />
                    <InfoCard label="Level" value={getAttribute("Level")} />
                    <InfoCard label="Grade" value={getAttribute("Grade")} />
                    <InfoCard
                      label="Score"
                      value={`${getAttribute("Score")}%`}
                    />
                    <InfoCard
                      label="Answers"
                      value={getAttribute("Correct Answers")}
                    />
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Issued:{" "}
                        {new Date(
                          getAttribute("Issued Date") * 1000
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 rounded-lg border border-blue-500/50">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300 font-semibold">
                      Soul-bound • Non-transferable
                    </span>
                  </div>
                </div>

                {/* Explorer Link */}
                <a
                  href={`https://shannon-explorer.somnia.network/token/${CONTRACT_ADDRESS}/instance/${tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-semibold text-center transition"
                >
                  View on Somnia Explorer
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!nft && !loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">How to use:</h3>
            <ol className="space-y-2 text-gray-300">
              <li>1. Enter the Token ID of the NFT you want to view</li>
              <li>2. Click "View NFT" or press Enter</li>
              <li>3. View the certificate image and details</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <p className="text-sm text-blue-300">
                <strong>Contract Address:</strong> {CONTRACT_ADDRESS}
              </p>
              <p className="text-sm text-blue-300 mt-1">
                <strong>Network:</strong> Somnia Testnet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-white font-semibold truncate">{value || "N/A"}</div>
  </div>
);

export default NFTCertificateViewer;
