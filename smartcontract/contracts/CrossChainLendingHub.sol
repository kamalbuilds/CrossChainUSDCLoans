// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IWormholeRelayer.sol";
import "./IWormholeReceiver.sol";
// import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrossChainLendingHub is IWormholeReceiver, Ownable {
    uint256 constant GAS_LIMIT = 500_000;

    IWormholeRelayer public immutable wormholeRelayer;
    uint16 public hubChainID;

    uint256 public lastInterestUpdate;

    mapping(address => uint256) public lastInteractionTime;
    uint256 public constant INTERACTION_COOLDOWN = 1 minutes;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;

    uint16[] public spokes;
    mapping(uint16 => address) public spokeAddresses;
    mapping(uint16 => uint256) public spokeBalances;
    mapping(uint16 => uint256[]) public spokeBalancesHistorical;

    uint256 public constant MAX_BORROW_RATIO = 75; // 75% of collateral
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80% of collateral

    uint256 public baseRate = 2; // 2% base rate
    uint256 public utilizationMultiplier = 20; // 20% multiplier

    event Deposit(uint16 spoke, address user, uint256 amount, uint256 balance);
    event Withdraw(uint16 spoke, address user, uint256 amount, uint256 balance);
    event Borrow(uint16 spoke, address user, uint256 amount);
    event Repay(uint16 spoke, address user, uint256 amount, uint256 remaining);
    event InterestAccrued(uint256 totalInterest);
    event Liquidation(address user, uint256 amount);

    constructor(address _wormholeRelayer, uint16 _hubChainID) Ownable(msg.sender) {
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
        hubChainID = _hubChainID;
        lastInterestUpdate = block.timestamp;
    }

    function quoteCrossChainCost(uint16 targetChain) public view returns (uint256 cost) {
        (cost, ) = wormholeRelayer.quoteEVMDeliveryPrice(targetChain, 0, GAS_LIMIT);
    }

    function calculateInterestRate() public view returns (uint256) {
        uint256 totalDeposits = getTotalDeposits();
        uint256 totalBorrows = getTotalBorrows();
        if (totalDeposits == 0) return baseRate;
        uint256 utilization = (totalBorrows * 1e18) / totalDeposits;
        return baseRate + (utilization * utilizationMultiplier) / 1e18;
    }

    function getTotalDeposits() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < spokes.length; i++) {
            total += spokeBalances[spokes[i]];
        }
        return total;
    }

    function getTotalBorrows() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < spokes.length; i++) {
            for (uint256 j = 0; j < spokeBalancesHistorical[spokes[i]].length; j++) {
                total += spokeBalancesHistorical[spokes[i]][j];
            }
        }
        return total;
    }

    function deposit(uint16 spoke, address user, uint256 amount) internal {
        require(block.timestamp >= lastInteractionTime[user] + INTERACTION_COOLDOWN, "Interaction too frequent");
        updateInterest();
        deposits[user] += amount;
        spokeBalances[spoke] += amount;
        spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);

        emit Deposit(spoke, user, amount, deposits[user]);
        lastInteractionTime[user] = block.timestamp;
    }

    function requestWithdraw(uint16 spoke, address user, uint256 amount) internal {
        require(block.timestamp >= lastInteractionTime[user] + INTERACTION_COOLDOWN, "Interaction too frequent");
        updateInterest();
        require(deposits[user] >= amount, "Insufficient balance");
        deposits[user] -= amount;
        
        withdrawSpoke(spoke, amount);

        emit Withdraw(spoke, user, amount, deposits[user]);
        lastInteractionTime[user] = block.timestamp;
    }

    function requestBorrow(uint16 spoke, address user, uint256 amount) internal {
        require(block.timestamp >= lastInteractionTime[user] + INTERACTION_COOLDOWN, "Interaction too frequent");
        updateInterest();
        uint256 newBorrowAmount = borrows[user] + amount;
        require(deposits[user] * MAX_BORROW_RATIO / 100 >= newBorrowAmount, "Not enough collateral");
        
        withdrawSpoke(spoke, amount);
        borrows[user] = newBorrowAmount;

        emit Borrow(spoke, user, amount);
        lastInteractionTime[user] = block.timestamp;
    }

    function repayBorrow(uint16 spoke, address user, uint256 amount) internal  {
        require(block.timestamp >= lastInteractionTime[user] + INTERACTION_COOLDOWN, "Interaction too frequent");
        updateInterest();
        uint256 borrowedAmount = borrows[user];

        require(borrowedAmount > 0, "No outstanding borrow");
        require(amount <= borrowedAmount, "Repayment exceeds borrowed amount");
        
        borrows[user] -= amount;
        spokeBalances[spoke] += amount;
        spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);

        emit Repay(spoke, user, amount, borrows[user]);
        lastInteractionTime[user] = block.timestamp;
    }

    function updateInterest() internal {
        uint256 timeElapsed = block.timestamp - lastInterestUpdate;
        if (timeElapsed > 0) {
            uint256 totalBorrows = getTotalBorrows();
            uint256 currentRate = calculateInterestRate();
            uint256 interest = totalBorrows * currentRate * timeElapsed / (365 days * 100);
            
            uint256 totalDeposits = getTotalDeposits();
            for (uint256 i = 0; i < spokes.length; i++) {
                uint16 spoke = spokes[i];
                uint256 spokeInterest = interest * spokeBalances[spoke] / totalDeposits;
                spokeBalances[spoke] += spokeInterest;
                spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);
            }

            lastInterestUpdate = block.timestamp;
            emit InterestAccrued(interest);
        }

        for (uint256 i = 0; i < spokes.length; i++) {
            for (uint256 j = 0; j < spokeBalancesHistorical[spokes[i]].length; j++) {
                checkAndLiquidate(address(uint160(j))); // This is a simplification, you may need to adjust based on how you store user addresses
            }
        }
    }

    function getCollateralRatio(address user) public view returns (uint256) {
        if (borrows[user] == 0) return 0;
        return (deposits[user] * 100) / borrows[user];
    }

    function checkAndLiquidate(address user) internal {
        if (getCollateralRatio(user) >= LIQUIDATION_THRESHOLD) {
            uint256 amountToLiquidate = borrows[user] - (deposits[user] * MAX_BORROW_RATIO / 100);
            borrows[user] -= amountToLiquidate;
            deposits[user] -= amountToLiquidate;

            uint256 totalDeposits = getTotalDeposits();
            for (uint256 i = 0; i < spokes.length; i++) {
                uint16 spoke = spokes[i];
                uint256 spokeLiquidation = amountToLiquidate * spokeBalances[spoke] / totalDeposits;
                spokeBalances[spoke] += spokeLiquidation;
                spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);
            }

            emit Liquidation(user, amountToLiquidate);
        }
    }

    function withdrawSpoke(uint16 spoke, uint256 amount) internal {
        require(spokeBalances[spoke] >= amount, "Insufficient spoke balance");
        spokeBalances[spoke] -= amount;
        spokeBalancesHistorical[spoke].push(spokeBalances[spoke]);

        bytes memory infoPayload = abi.encode(spoke, spokeAddresses[spoke], amount);
        bytes memory mainPayload = abi.encode("withdrawSpoke", infoPayload);

        uint256 cost = quoteCrossChainCost(spoke);

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            spoke,
            spokeAddresses[spoke],
            mainPayload,
            0,
            GAS_LIMIT
        );
    }

    function addSpoke(uint16 spoke, address spokeAddress) external onlyOwner {
        spokes.push(spoke);
        spokeAddresses[spoke] = spokeAddress;
        spokeBalances[spoke] = 0;
        spokeBalancesHistorical[spoke].push(0);
    }

    receive() external payable {}

    function sendEth(address payable recipient, uint256 amount) external onlyOwner {
        recipient.transfer(amount);
    }

    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory,
        bytes32,
        uint16 sourceChain,
        bytes32
    ) public payable override {
        require(msg.sender == address(wormholeRelayer), "Only relayer allowed");

        (string memory functionName, bytes memory infoPayload) = abi.decode(payload, (string, bytes));

        if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("deposit"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(infoPayload, (uint16, address, uint256));
            deposit(spoke, user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("withdraw"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(infoPayload, (uint16, address, uint256));
            requestWithdraw(spoke, user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("borrow"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(infoPayload, (uint16, address, uint256));
            requestBorrow(spoke, user, amount);
        } else if (keccak256(abi.encodePacked(functionName)) == keccak256(abi.encodePacked("repay"))) {
            (uint16 spoke, address user, uint256 amount) = abi.decode(infoPayload, (uint16, address, uint256));
            repayBorrow(spoke, user, amount);
        }
    }
}