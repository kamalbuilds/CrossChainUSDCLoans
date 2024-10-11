// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CrossChainToken is ERC20 {
    address[] public owners;

    constructor() ERC20("MultiChainToken", "MCT") {
        uint256 initialSupply = 1000000 * 10 ** 18;
        _mint(msg.sender, initialSupply);
        owners.push(msg.sender);
    }

    function mint(address recipiant, uint256 amount) public onlyOwner {
        _mint(recipiant, amount);
    }

    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }

    modifier onlyOwner {
        bool isOwner = false;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Only owners can call this function");
        _;
    }

    function addOwner(address newOwner) public onlyOwner {
        owners.push(newOwner);
    }


}