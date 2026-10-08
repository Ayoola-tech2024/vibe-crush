// Web3 Implementation for Vibe Crush

const VCT_ADDRESS = "0x46aE7fe808648c7d9AD3a33E63b88B21F3A4c697";
const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"; // Standard burn address
const BOOST_PRICE = ethers.parseUnits("50", 18); // 50 VCT

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint amount) returns (bool)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

let provider;
let signer;
let userAddress;
let vctContract;

const btnConnect = document.getElementById("btnWeb3Connect");
const btnBoost = document.getElementById("btnWeb3Boost");
const web3Status = document.getElementById("web3Status");
const web3ActionText = document.getElementById("web3ActionText");
const coinsValue = document.getElementById("coinsValue"); // We take over the Gems UI!

async function initWeb3() {
    if (window.ethereum == null) {
        alert("⚠️ Please install MetaMask or a Web3 wallet browser extension!");
        return;
    }

    try {
        btnConnect.style.opacity = "0.5";
        web3ActionText.innerText = "Connecting...";

        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        
        vctContract = new ethers.Contract(VCT_ADDRESS, ERC20_ABI, signer);

        // Update UI
        btnConnect.style.opacity = "1";
        btnConnect.style.background = "var(--vibe-cyan)";
        web3ActionText.innerText = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
        web3ActionText.style.color = "var(--charcoal-ink)";
        web3Status.innerText = "Connected";
        web3Status.style.color = "var(--charcoal-ink)";
        
        btnBoost.classList.remove("hidden");

        await updateBalance();
    } catch (err) {
        console.error(err);
        btnConnect.style.opacity = "1";
        web3ActionText.innerText = "Connection Failed";
        alert("❌ Failed to connect wallet.");
    }
}

async function updateBalance() {
    try {
        const balanceWei = await vctContract.balanceOf(userAddress);
        const balanceFormatted = ethers.formatUnits(balanceWei, 18);
        coinsValue.innerText = parseFloat(balanceFormatted).toFixed(2);
    } catch(err) {
        console.error("Balance read error", err);
        coinsValue.innerText = "ERR";
    }
}

async function buySuperBomb() {
    try {
        btnBoost.style.opacity = "0.5";
        btnBoost.innerHTML = `<div style="text-align: center; width: 100%;"><strong>⏳ Confirming in Wallet...</strong></div>`;
        
        const tx = await vctContract.transfer(BURN_ADDRESS, BOOST_PRICE);
        
        btnBoost.innerHTML = `<div style="text-align: center; width: 100%;"><strong>⏳ Mining Tx...</strong></div>`;
        await tx.wait(); // wait for block confirmation
        
        btnBoost.style.opacity = "1";
        btnBoost.innerHTML = `<div style="text-align: center; width: 100%;"><strong>✅ Super Bomb Activated!</strong></div>`;
        setTimeout(() => {
            btnBoost.innerHTML = `<div style="text-align: center; width: 100%;"><strong style="font-size: 1.1rem;">🔥 Buy Super Bomb</strong><br/><span style="font-size: 0.85rem; opacity: 0.9;">Spend 50 $VCT</span></div>`;
        }, 3000);
        
        await updateBalance();
        
        // Trigger the in-game bomb mechanic
        if (typeof window.game !== 'undefined') {
            window.game.boosters.bomb += 5;
            window.game.updateBoosterUI();
            localStorage.setItem("vibecrush_boosters", JSON.stringify(window.game.boosters));
            alert("✅ On-Chain Transaction Successful! 5 Super Bombs have been added to your inventory!");
        } else {
            alert("✅ Transaction successful! (Game instance not found)");
        }

    } catch (err) {
        console.error("Tx error", err);
        alert("❌ Transaction failed or was rejected.");
        btnBoost.style.opacity = "1";
        btnBoost.innerHTML = `<div style="text-align: center; width: 100%;"><strong style="font-size: 1.1rem;">🔥 Buy Super Bomb</strong><br/><span style="font-size: 0.85rem; opacity: 0.9;">Spend 50 $VCT</span></div>`;
    }
}

if (btnConnect) btnConnect.addEventListener("click", initWeb3);
if (btnBoost) btnBoost.addEventListener("click", buySuperBomb);
