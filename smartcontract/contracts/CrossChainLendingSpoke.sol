// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MultiChainToken.sol";

// wormhole imports
import "./IWormholeReceiver.sol";
import "./IWormholeRelayer.sol";

// 
contract CrossChainLendingSpoke is IWormholeReceiver {
    uint256 constant GAS_LIMIT = 500_000;
    IWormholeRelayer public immutable wormholeRelayer;
    uint16 spokeChainID;
    uint16 hubChainID;
    address hubAddress;


    address crossChainMessageAddr;
    MultiChainToken public token;

    mapping(address => uint256) public approvedWithdraws;
    mapping(address => uint256) public approvedBorrows;

    constructor(address _tokenAddr, address _wormholeRelayer, uint16 _spokeChainID, uint16 _hubChainID, address _hubAddress) {
        token = MultiChainToken(_tokenAddr);
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
        spokeChainID = _spokeChainID;
        hubChainID = _hubChainID;
        hubAddress = _hubAddress;
    }

    function quoteCrossChainCost(
        uint16 targetChain
    ) public view returns (uint256 cost) {
        (cost, ) = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            0,
            GAS_LIMIT
        );
    }

    // Allows users to deposit ETH into the contract
    function deposit(uint256 amount) external {
        address user = msg.sender;

        require(token.transferFrom(user, address(this), amount), "Transfer failed");

        uint256 cost = quoteCrossChainCost(hubChainID);

        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(spokeChainID, user, amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("deposit", infoPayload);
        
        wormholeRelayer.sendPayloadToEvm{value: cost}(
            hubChainID,
            hubAddress,
            mainPayload,
            0,
            GAS_LIMIT
        );
    }

    function repayBorrow(uint256 amount) external {
        address user = msg.sender;

        require(token.transferFrom(user, address(this), amount), "Transfer failed");

        uint256 cost = quoteCrossChainCost(hubChainID);

        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(spokeChainID, user, amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("repayBorrow", infoPayload);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            hubChainID,
            hubAddress,
            mainPayload,
            0,
            GAS_LIMIT
        );
    }

    function requestWithdraw(uint256 amount) external {
        address user = msg.sender;

        uint256 cost = quoteCrossChainCost(hubChainID);

        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(spokeChainID, user, amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("requestWithdraw", infoPayload);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            hubChainID,
            hubAddress,
            mainPayload,
            0,
            GAS_LIMIT
        );
    }

    function requestBorrow(uint256 amount) external {
        address user = msg.sender;

        uint256 cost = quoteCrossChainCost(hubChainID);

        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(spokeChainID, user, amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("requestBorrow", infoPayload);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            hubChainID,
            hubAddress,
            mainPayload,
            0,
            GAS_LIMIT
        );
    }

    function withdraw(address sender) internal {
        uint256 withdrawAmount = approvedWithdraws[sender];
        approvedWithdraws[sender] = 0;
        
        token.transfer(sender, withdrawAmount);
    }

    function borrow(address sender) internal {
        require(approvedBorrows[sender] > 0, "No approved borrows");
        uint256 borrowAmount = approvedBorrows[sender];
        approvedBorrows[sender] = 0;
        token.transfer(sender, borrowAmount);
    }

    event apporveWithdrawEvent(address user, uint256 amount);
    function approveWithdraw(address user, uint256 amount) internal {
        approvedWithdraws[user] = amount;
        emit apporveWithdrawEvent(user, amount);
        withdraw(user);
    }

    event apporveBorrowEvent(address user, uint256 amount);
    function approveBorrow(address user, uint256 amount) internal {
        approvedBorrows[user] = amount;
        emit apporveBorrowEvent(user, amount);
        borrow(user);
    }

    event bridgeToSpokeEvent(uint16 spokeID, address spokeAddr, uint256 amount);
    function bridgeToSpoke(uint16 spokeID, address spokeAddr, uint256 amount) internal {
        token.burn(amount);

        uint256 cost = quoteCrossChainCost(spokeID);

        // Info payload is the bytes of the information that's actually valuable
        bytes memory infoPayload = abi.encode(amount);
        // Main payload just contains which function to call
        bytes memory mainPayload = abi.encode("receiveTokens", infoPayload);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            spokeID,
            spokeAddr,
            mainPayload,
            0,
            GAS_LIMIT
        );

        emit bridgeToSpokeEvent(spokeID, spokeAddr, amount);
    }

    event receiveTokensEvent(uint256 amount);
    function receiveTokens(uint256 amount) internal {
        token.mint(address(this), amount);

        emit receiveTokensEvent(amount);
    }

    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory, // additionalVaas
        bytes32, // address that called 'sendPayloadToEvm' (HelloWormhole contract address)
        uint16 sourceChain,
        bytes32 // unique identifier of delivery
    ) public payable override {
        require(msg.sender == address(wormholeRelayer), "Only relayer allowed");

        (string memory functionName, bytes memory infoPayload) = abi.decode(payload, (string, bytes));

        if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("approveWithdraw"))) {
            (address user, uint256 amount) = abi.decode(infoPayload, (address, uint256));
            approveWithdraw(user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("approveBorrow"))) {
            (address user, uint256 amount) = abi.decode(infoPayload, (address, uint256));
            approveBorrow(user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("bridgeToSpoke"))) {
            (uint16 spokeID, address spokeAddr, uint256 amount) = abi.decode(infoPayload, (uint16, address, uint256));
            bridgeToSpoke(spokeID, spokeAddr, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("receiveTokens"))) {
            (uint256 amount) = abi.decode(infoPayload, (uint256));
            receiveTokens(amount);
        }
    }

    receive() external payable {}

    function sendEth(address payable recipient, uint256 amount) external {
        recipient.transfer(amount);
    }

}