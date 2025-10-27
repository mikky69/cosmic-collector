// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract COSMToken {
    string public name = "Cosmic Token";
    string public symbol = "COSM";
    uint8 public decimals = 8;
    uint256 public totalSupply;
    uint256 public maxSupply = 1000000000 * 10**8;
    
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor() {
        owner = msg.sender;
        uint256 initialSupply = maxSupply / 10;
        totalSupply = initialSupply;
        balanceOf[owner] = initialSupply;
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
}
