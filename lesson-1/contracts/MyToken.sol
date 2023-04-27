//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.18;

import "./interfaces/IERC20.sol";

contract MyToken is IERC20{
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        _mint(msg.sender, 1 ether);
    }

    function balanceOf(address _owner) public view override returns (uint256 balance) {
        balance = _balances[_owner];
    }

    function transfer(address _to, uint256 _value) public override returns (bool success) {
        require(_balances[msg.sender] >= _value, "ERC20: Not enough balance");

        _balances[msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);

        success = true;
    }
    
    function allowance(address _owner, address _spender) public view override returns (uint256) {
        return _allowances[_owner][_spender];
    }

    function approve(address _spender, uint256 _value) public override returns (bool success) {
        _allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        success = true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public override returns (bool) {
        require(_allowances[_from][msg.sender] >= _value, "MyToken: Insufficient allowance");
        require(_balances[_from] >= _value, "MyToken: Not enough balance");
    
        _balances[_from] -= _value;
        _balances[_to] += _value;
        _allowances[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

    // function burn(address _owner, uint256 _amount) public {}

    // function mint(address _owner, uint256 _amount) public {}
}