// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IWormholeRelayer.sol";
import "./IWormholeReceiver.sol";

// Find the relayer addr from docs - https://docs.wormhole.com/wormhole/reference/blockchain-environments/evm#wormhole-details-18
contract CrossChainLendingHub is IWormholeReceiver{
    // gas limit set
    uint256 constant GAS_LIMIT = 500_000;

    IWormholeRelayer public immutable wormholeRelayer;
    uint16 hubChainID;

    function quoteCrossChainCost(
        uint16 targetChain
    ) public view returns (uint256 cost) {
        (cost, ) = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            0,
            GAS_LIMIT
        );
    }

    // mapping of borrowers and depositers, and the amounts they borrowed / deposited
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;

    // value contained in each of the spoke contracts
    uint16[] public spokes;
    mapping(uint16 => address) public spokeAddresses;
    mapping(uint16 => uint256) public spokeBalances;
    mapping(uint16 => uint256[]) public spokeBalancesHistorical;

    event Deposit(uint16 spoke, address user, uint256 amount, uint256 balance);
    event Withdraw(uint16 spoke, address user, uint256 amount, uint256 balance);
    event Borrow(uint16 spoke, address user, uint256 amount);
    event Repay(uint16 spoke, address user, uint256 amount, uint256 remaining);

    constructor(address _wormholeRelayer, uint16 _hubChainID) {
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
        hubChainID = _hubChainID;
    }

    function deposit(uint16 spoke, address user, uint256 amount) internal {
        deposits[user] += amount;
        spokeBalances[spoke] += amount;
        spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);

        emit Deposit(spoke, user, amount, deposits[user]);
    }

    // Allows users to repay their borrowed ETH
    // 
    // This doesn't return in a failure case, so if a user tries to repay more 
    // than they owe or if they don't have any outstanding borrows, their funds
    // will be locked in the contract.
    function repayBorrow(uint16 spoke, address user, uint256 amount) internal {
        uint256 borrowedAmount = borrows[user];

        require(borrowedAmount > 0, "No outstanding borrow");
        require(amount <= borrowedAmount, "Repayment exceeds borrowed amount");
        
        borrows[user] -= amount;
        spokeBalances[spoke] += amount;
        spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);

        emit Repay(spoke, user, amount, borrows[user]);
    }

    function requestWithdraw(uint16 spoke, address user, uint256 amount) internal {
        require(deposits[user] >= amount, "Insufficient balance");
        deposits[user] -= amount;
        
        withdrawSpoke(spoke, amount);

        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(user, amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("approveWithdraw", infoPayload);
        
        uint256 cost = quoteCrossChainCost(spoke);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            spoke,
            spokeAddresses[spoke],
            mainPayload,
            0,
            GAS_LIMIT
        );


        emit Withdraw(spoke, user, amount, deposits[user]);
    }

    function requestBorrow(uint16 spoke, address user, uint256 amount) internal {
        require(deposits[user] / 2 >= borrows[user] + amount, "Not enough collateral");
        
        withdrawSpoke(spoke, amount);
        borrows[user] += amount;

        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(user, amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("approveBorrow", infoPayload);

        uint256 cost = quoteCrossChainCost(spoke);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            spoke,
            spokeAddresses[spoke],
            mainPayload,
            0,
            GAS_LIMIT
        );

        emit Borrow(spoke, user, amount);
    }

    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory, // additionalVaas
        bytes32, // address that called 'sendPayloadToEvm'
        uint16, // spoke
        bytes32 // unique identifier of delivery
    ) public payable override {
        require(msg.sender == address(wormholeRelayer), "Only relayer allowed");

        // Parse the payload and do the corresponding actions!
        (string memory functionName, bytes memory infoPayload) = abi.decode(
            payload,
            (string, bytes)
        );

        if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("deposit"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(
                infoPayload,
                (uint16, address, uint256)
            );
            deposit(spoke, user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("repayBorrow"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(
                infoPayload,
                (uint16, address, uint256)
            );
            repayBorrow(spoke, user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("requestWithdraw"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(
                infoPayload,
                (uint16, address, uint256)
            );
            requestWithdraw(spoke, user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("requestBorrow"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(
                infoPayload,
                (uint16, address, uint256)
            );
            requestBorrow(spoke, user, amount);
        }
    }

    // withdrawSpoke withdraws an amount from a spoke.  If that spoke can't pay 
    // the amount, re-distributes liquidity so that it has enough.
    function withdrawSpoke(uint16 spoke, uint256 amount) internal {
        if (spokeBalances[spoke] < amount) {
            redistributeValueToSpoke(spoke, amount);
        }

        spokeBalances[spoke] -= amount;
        spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);
    }

    // redistributeValueToSpoke distributes the liquidity from all spokes into 
    // a target spoke, making sure that the selected spoke has a given amount
    // of liquidity 
    function redistributeValueToSpoke(uint16 dSpoke, uint256 targetAmount) internal {
        require(spokeBalances[dSpoke] < targetAmount, "Spoke already has enough liquidity");

        // calculate the desired value per spoke
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < spokes.length; i++) {
            totalAmount += spokeBalances[spokes[i]];
        }
        uint256 desiredSpokeValue = totalAmount / spokes.length;

        // calculate how much to re-distribute to the target spoke
        uint256 deltaSpokeValue = desiredSpokeValue - spokeBalances[dSpoke];
        deltaSpokeValue = max(targetAmount, deltaSpokeValue);

        // re-distribute from all spokes to the target spoke
        for (uint256 i = 0; i < spokes.length; i++) {
            uint16 tSpoke = spokes[i];
            if (tSpoke == dSpoke) {
                continue;
            }

            uint256 transferAmount = min(deltaSpokeValue, spokeBalances[tSpoke] - desiredSpokeValue);

            // transfer the transferAmount from the target spoke to the destination spoke
            deltaSpokeValue -= transferAmount;

            sendBridgeRequest(tSpoke, dSpoke, transferAmount);
        }
    }

    function sendBridgeRequest(uint16 tSpoke, uint16 dSpoke, uint256 amount) internal {
        require(spokeBalances[tSpoke] >= amount, "Insufficient balance");

        spokeBalances[tSpoke] -= amount;
        spokeBalancesHistorical[tSpoke].push(spokeBalances[tSpoke]);
        spokeBalances[dSpoke] += amount;
        spokeBalancesHistorical[dSpoke].push(spokeBalances[dSpoke]);


        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(dSpoke, spokeAddresses[dSpoke], amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("bridgeToSpoke", infoPayload);

        uint256 cost = quoteCrossChainCost(tSpoke);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            tSpoke,
            spokeAddresses[tSpoke],
            mainPayload,
            0,
            GAS_LIMIT
        );
    }

    function addSpoke(uint16 spoke, address spokeAddress) internal {
        spokes.push(spoke);
        spokeAddresses[spoke] = spokeAddress;
        spokeBalances[spoke] = 0;
        spokeBalancesHistorical[spoke].push(0);
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    receive() external payable {}

    function sendEth(address payable recipient, uint256 amount) external {
        recipient.transfer(amount);
    }
}