// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface ICrossChainLend {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function borrow(uint256 amount) external;
    function repayBorrow(uint256 amount) external;
    function getBalance() external view returns (uint256);
}