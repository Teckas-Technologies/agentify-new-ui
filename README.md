<p align="center">
  <img src="https://img.shields.io/badge/Mantle-Network-green?style=for-the-badge&logo=ethereum" alt="Mantle Network"/>
  <img src="https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge&logo=openai" alt="AI Powered"/>
  <img src="https://img.shields.io/badge/DeFi-Agent-purple?style=for-the-badge" alt="DeFi Agent"/>
  <img src="https://img.shields.io/badge/Status-Live%20on%20Mainnet-brightgreen?style=for-the-badge" alt="Live on Mainnet"/>
</p>

<h1 align="center">Agentify AI</h1>

<h3 align="center">The AI-Powered DeFi Command Center for Mantle Network</h3>

<p align="center">
  <strong>Execute complex DeFi operations through natural language. Bridge, Lend, Borrow, Stake, and Swap—all with simple conversational commands.</strong>
</p>

<p align="center">
  <a href="https://app.agentifyai.xyz">Live Demo</a> •
  <a href="#demo-video">Demo Video</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#mantle-integrations">Mantle Integrations</a>
</p>

---

## The Problem

DeFi on Mantle Network is powerful, but complex. Users face:

- **Fragmented Experience**: Jumping between multiple dApps for bridge, lending, and swaps
- **Complex Interfaces**: Technical UIs that intimidate newcomers
- **High Learning Curve**: Understanding protocols, gas optimization, and transaction flows
- **No Unified Dashboard**: Difficulty tracking activities across protocols

**Result**: Billions in TVL remain underutilized because DeFi is too hard for most users.

---

## The Solution: Agentify AI

Agentify transforms DeFi interaction through **AI-powered natural language commands**. Instead of navigating complex UIs, users simply describe what they want:

```
"Bridge 100 MNT from Ethereum to Mantle"
"Deposit 500 USDC into Lendle and earn yield"
"Swap 1 ETH for MNT on FusionX"
"Stake my LEND tokens"
```

The AI agent understands intent, validates parameters, and executes multi-step blockchain transactions seamlessly.

---

## Demo Video

<p align="center">
  <a href="https://youtube.com/watch?v=YOUR_VIDEO_ID">
    <img src="https://img.shields.io/badge/Watch%20Demo-YouTube-red?style=for-the-badge&logo=youtube" alt="Watch Demo"/>
  </a>
</p>

**[Click to watch 4-minute demo →](https://youtube.com/watch?v=YOUR_VIDEO_ID)**

---

## Features

### AI-Powered Agent System

| Feature | Description |
|---------|-------------|
| **Natural Language Processing** | Understands complex DeFi intents from plain English |
| **Multi-Step Execution** | Handles approvals, transactions, and confirmations automatically |
| **Real-Time Feedback** | Live transaction status updates and confirmations |
| **Error Recovery** | Intelligent error handling with user-friendly explanations |
| **Context Awareness** | Remembers conversation history for follow-up commands |

### Comprehensive Dashboard

- **Agent Usage Analytics**: Visual charts of command distribution
- **Transaction History**: Complete activity log with status tracking
- **Gas Spend Monitoring**: Track transaction costs over time
- **Chain Activity Breakdown**: Per-chain statistics and insights
- **Portfolio Overview**: Unified view of all positions

### Multi-Chain Architecture

Agentify supports seamless operations across:

| Chain | Status | Features |
|-------|--------|----------|
| **Mantle** | Primary | Bridge, Lendle, FusionX |
| Ethereum | Supported | Bridge source chain |
| Arbitrum | Supported | Cross-chain swaps |
| Polygon | Supported | Cross-chain swaps |
| Base | Supported | Cross-chain swaps |
| Optimism | Supported | Cross-chain swaps |

---

## Mantle Integrations

### 1. Mantle Bridge - Cross-Chain Asset Transfer

<table>
<tr>
<td width="50%">

**Deposit (L1 → Mantle)**
- Bridge MNT from Ethereum to Mantle
- Bridge ETH to Mantle (wraps to WETH)
- Bridge ERC-20 tokens
- Bridge NFTs (ERC-721)

**Withdraw (Mantle → L1)**
- Initiate withdrawal
- Prove withdrawal after challenge period
- Finalize and claim on L1

</td>
<td width="50%">

**Smart Contract Addresses**
```
L1StandardBridge:
0x95fC37A27a2f68e3A647CDc081F0A89bb47c3012

L1CrossDomainMessenger:
0x676A795fe6E43C17c668de16730c3F690FEB7120

OptimismPortal:
0xc54cb22944F2bE476E02dECfCD7e3E7d3e15A8Fb
```

</td>
</tr>
</table>

**Example Commands:**
```
"Bridge 100 MNT to Mantle"
"Withdraw 50 ETH from Mantle to Ethereum"
"Check my pending bridge withdrawals"
```

---

### 2. Lendle Protocol - Lending & Borrowing

<table>
<tr>
<td width="50%">

**Lending Operations**
- **Deposit**: Supply assets to earn yield
- **Withdraw**: Remove deposited assets
- **Borrow**: Take loans against collateral
- **Repay**: Pay back borrowed amounts

**Staking**
- Stake LEND tokens for rewards
- Unstake and claim rewards
- View staking APY

</td>
<td width="50%">

**Supported Assets**
| Asset | Deposit | Borrow |
|-------|---------|--------|
| WMNT | ✅ | ✅ |
| WETH | ✅ | ✅ |
| USDC | ✅ | ✅ |
| USDT | ✅ | ✅ |
| mETH | ✅ | ✅ |
| WBTC | ✅ | ✅ |

</td>
</tr>
</table>

**Smart Contract Addresses**
```
LendingPool:           0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3
ProtocolDataProvider:  0x552b9e4bae485C4B7F540777d7D25614CdB84773
ChefIncentives:        0x79e2fd1c484EB9EE45001A98Ce31F28918F27C41
MultiFeeDistribution:  0x76F0f2e15b6dd854BE5e81d5E22a8Cf7a8cC1503
```

**Example Commands:**
```
"Deposit 1000 USDC into Lendle"
"Borrow 500 USDT against my collateral"
"What's my current health factor?"
"Stake 100 LEND tokens"
```

---

### 3. FusionX DEX - Token Swaps

<table>
<tr>
<td width="50%">

**Swap Features**
- **V2 Swaps**: Classic AMM with constant product
- **V3 Swaps**: Concentrated liquidity for better rates
- **Smart Routing**: Optimal path finding
- **Slippage Protection**: Configurable tolerance

**Liquidity**
- Add liquidity to pools
- Remove liquidity positions
- View LP token balances

</td>
<td width="50%">

**Fee Tiers (V3)**
| Tier | Best For |
|------|----------|
| 0.01% | Stable pairs |
| 0.05% | Correlated assets |
| 0.30% | Standard pairs |
| 1.00% | Exotic pairs |

</td>
</tr>
</table>

**Smart Contract Addresses**
```
V2 Router:           0xDd0840118bF9CCCc6d67b2944ddDfbdb995955FD
V3 SwapRouter:       0x5989FB161568b9F133eDf5Cf6787f5597762797F
V3 PositionManager:  0x5752F085206AB87d8a5EF6166779658ADD455774
V3 Factory:          0x530d2766D1988CC1c000C8b7d00334c14B69AD71
```

**Example Commands:**
```
"Swap 1 ETH for MNT"
"Exchange 500 USDC for WETH with 0.5% slippage"
"What's the best rate for 1000 MNT to USDC?"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENTIFY AI                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Chat UI    │───▶│  AI Engine   │───▶│   Executor   │       │
│  │  (Next.js)   │    │  (OpenAI)    │    │   (Hooks)    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────────────┐
│  │                  Protocol Hooks Layer                        │
│  ├──────────────┬──────────────┬──────────────┬─────────────────┤
│  │ useMantleHook│ useLendleHook│useFusionXHook│  Other Hooks    │
│  │   (Bridge)   │  (Lending)   │   (DEX)      │                 │
│  └──────────────┴──────────────┴──────────────┴─────────────────┘
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐
│  │              Blockchain Interaction Layer                     │
│  │         wagmi + viem + ethers.js + Privy Auth                 │
│  └──────────────────────────────────────────────────────────────┘
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │              MANTLE NETWORK                   │
        ├──────────────┬──────────────┬────────────────┤
        │    Bridge    │    Lendle    │    FusionX     │
        │   Contracts  │   Protocol   │      DEX       │
        └──────────────┴──────────────┴────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **State** | Zustand, React Context |
| **Blockchain** | wagmi 2.16, viem 2.33, ethers.js 5.8 |
| **Authentication** | Privy (Multi-wallet + Social Login) |
| **AI Engine** | OpenAI GPT-4 |
| **Backend** | Python Flask (Agent Orchestration) |
| **Analytics** | Chart.js, Recharts |

---

## Project Structure

```
agentify-new-ui/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── playground/           # AI Agent Playground
│   │   ├── dashboard/            # Analytics Dashboard
│   │   ├── mantle/               # Mantle Operations UI
│   │   └── agents/               # Agent Discovery
│   │
│   ├── hooks/                    # Protocol Integration Hooks
│   │   ├── useMantleHook.ts      # Bridge operations (61KB)
│   │   ├── useLendleHook.ts      # Lending protocol (70KB)
│   │   ├── useFusionXHook.ts     # DEX swaps (92KB)
│   │   └── orchestratedAgentHook.tsx  # AI orchestration
│   │
│   ├── Components/               # UI Components
│   │   ├── NewDesign/
│   │   │   ├── playground/       # Chat interface
│   │   │   ├── Dashboard/        # Analytics components
│   │   │   └── Agents/           # Agent cards
│   │   └── ui/                   # Radix primitives
│   │
│   ├── contexts/                 # Global State
│   ├── types/                    # TypeScript Definitions
│   └── utils/                    # Helpers & Constants
│
├── Documentation/                # Integration docs
└── public/                       # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MetaMask or any Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/Teckas-Technologies/agentify-new-ui.git

# Navigate to project
cd agentify-new-ui

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PYTHON_SERVER_URL=your_backend_url
NEXT_PUBLIC_CHANGENOW_API_KEY=your_changenow_key
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Usage Examples

### Bridge Assets

```
User: "Bridge 100 MNT from Ethereum to Mantle"

Agentify: I'll help you bridge 100 MNT to Mantle Network.

✓ Checking MNT balance on Ethereum... 250 MNT available
✓ Estimating gas fees... ~0.003 ETH
✓ Initiating bridge transaction...
✓ Transaction submitted: 0x1234...abcd

Your 100 MNT will arrive on Mantle in ~10-15 minutes.
```

### Lend on Lendle

```
User: "Deposit 1000 USDC into Lendle and show me the APY"

Agentify: I'll deposit your USDC into Lendle Protocol.

✓ Current USDC Supply APY: 4.2%
✓ Approving USDC for Lendle...
✓ Depositing 1000 USDC...
✓ Transaction confirmed: 0xabcd...1234

You're now earning 4.2% APY on 1000 USDC!
```

### Swap on FusionX

```
User: "Swap half my ETH for MNT"

Agentify: Let me check your balance and find the best rate.

✓ Your ETH balance: 2.5 ETH
✓ Swapping 1.25 ETH for MNT
✓ Best rate found: 1 ETH = 3,150 MNT
✓ Expected output: ~3,937 MNT (0.5% slippage)
✓ Transaction confirmed!

Swapped 1.25 ETH → 3,921 MNT
```

### Stake LEND Tokens

```
User: "Stake all my LEND tokens"

Agentify: I'll stake your LEND tokens for rewards.

✓ Your LEND balance: 500 LEND
✓ Approving LEND for staking...
✓ Staking 500 LEND tokens...
✓ Transaction confirmed!

Successfully staked 500 LEND. Current staking APR: 12.5%
```

---

## Why Agentify?

- **Deep Protocol Integration**: Native support for Lendle lending, FusionX swaps, and Mantle Bridge
- **LLM-Powered Agent**: GPT-4 understands complex financial intents
- **Three Native Protocols**: Bridge + Lendle + FusionX fully integrated. Mainnet Deployed: Production-ready, not just testnet demos
- **Chat-First Interface**: No complex forms or confusing buttons. Real-Time Feedback: Users see every transaction step
- **Accessible DeFi**: Opens Mantle ecosystem to non-technical users. Multi-Wallet Support: MetaMask, WalletConnect, Google, Phone

---

## Roadmap

| Phase | Milestone |
|-------|-----------|
| **Q1 2026** | Mantle mainnet launch ✅, Core agent features ✅ |
| **Q2 2026** | Yield optimization strategies, Portfolio analytics |
| **Q3 2026** | Mobile app, Advanced risk management |
| **Q4 2026** | Multi-agent coordination, DAO governance |

---

## Team

| Member | Role | Background |
|--------|------|------------|
| **[Team Lead]** | Full Stack Developer | [Experience] |
| **[Member 2]** | Smart Contract Engineer | [Experience] |
| **[Member 3]** | AI/ML Engineer | [Experience] |
| **[Member 4]** | Product & Design | [Experience] |

---

## Links

| Resource | Link |
|----------|------|
| **Live Demo** | [https://app.agentifyai.xyz](https://app.agentifyai.xyz) |
| **Demo Video** | [YouTube Link](https://youtube.com/watch?v=YOUR_VIDEO_ID) |
| **GitHub** | [Teckas-Technologies/agentify-new-ui](https://github.com/Teckas-Technologies/agentify-new-ui) |
| **Twitter** | [@agentifyxyz](https://x.com/agentifyxyz) |
| **Organization** | [Teckas Technologies](https://www.teckastechnologies.com/) |

---

## Compliance Declaration

This project does not involve regulated assets or securities. All operations are conducted on public blockchain networks with full transparency. Users maintain complete custody of their assets at all times through their own wallets.

---

## License

MIT License © 2025 Agentify AI

---

<p align="center">
  <strong>Built with ❤️ for the Mantle Global Hackathon 2025</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Mantle-Global%20Hackathon%202025-green?style=for-the-badge" alt="Mantle Hackathon"/>
</p>
