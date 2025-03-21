import { ERC20_2612Service, ERC20Service, EthereumTransactionTypeExtended, Pool } from "@aave/contract-helpers";
import { BigNumber, ethers, Signer } from "ethers";

interface SupplyOptions {
    user: string;
    reserve: string;
    amount: string;
    onBehalfOf: string;
    provider: ethers.providers.Web3Provider;
    signer: Signer;
}

export async function supplyWithSign({
    user,
    reserve,
    amount,
    onBehalfOf,
    provider,
    signer,
}: SupplyOptions): Promise<void> {
    try {
        const pool = new Pool(provider, {
            POOL: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // sepolia
            WETH_GATEWAY: "0xDde0E8E6d3653614878Bf5009EDC317BC129fE2F", // weth
        });

        console.log("Transaction");
        const deadline = Math.floor(Date.now() / 1000 + 3600).toString();

        const data = await generateSupplySignatureRequest(
            user,
            reserve,
            amount,
            deadline,
            provider
        );
        console.log(data);
        const address = await signer.getAddress();
        const signature: string = await provider.send("eth_signTypedData_v4", [
            address,
            data,
        ]);
        console.log(signature);

        const txs: EthereumTransactionTypeExtended[] = await pool.supplyWithPermit({
            user,
            reserve,
            amount,
            signature,
            onBehalfOf,
            deadline,
        });

        for (const tx of txs) {
            const extendedTxData = await tx.tx();
            const { from, ...txData } = extendedTxData;
            const txResponse = await signer.sendTransaction({
                ...txData,
                value: txData.value ? BigNumber.from(txData.value) : undefined,
            });
            console.log(txResponse);
        }
        console.log("Transaction Completed");
    } catch (error) {
        // Handle errors appropriately
        console.error("Error in supply:", error);
        // throw new Error(`Error in supply: ${error.message}`);
    }
}

async function generateSupplySignatureRequest(
    user: string,
    token: string,
    amount: string,
    deadline: string,
    provider: ethers.providers.Web3Provider
): Promise<string> {
    // Assuming `pool` is an instance of Pool, replace it with your actual instance
    const spender = "0x6ae43d3271ff6888e7fc43fd7321a503ff738951"; // Assuming Pool has a method to get its address
    const tokenERC20Service = new ERC20Service(provider);
    const tokenERC2612Service = new ERC20_2612Service(provider);

    const { name, decimals } = await tokenERC20Service.getTokenData(token);
    const { chainId } = await provider.getNetwork();
    const convertedAmount = "1000000"
    // amount === "-1"
    //     ? "1000000"
    //     : valueToWei(amount, decimals);
    const nonce = await tokenERC2612Service.getNonce({
        token,
        owner: user,
    });

    const EIP712DomainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
    ];

    const PermitType = [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ];

    const data = {
        types: {
            EIP712Domain: EIP712DomainType,
            Permit: PermitType,
        },
        primaryType: "Permit",
        domain: {
            name,
            version: "1",
            chainId,
            verifyingContract: token,
        },
        message: {
            owner: user,
            spender: spender,
            value: convertedAmount,
            nonce,
            deadline,
        },
    };

    const jsonString = JSON.stringify(data);
    return jsonString;
}

// const valueToWei = (value: string, decimals: number): string => {
//     return new BigNumberJs(value).shiftedBy(decimals).toFixed(0);
// };