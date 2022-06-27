//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OnlyOneAirdrop is ERC20 {
    constructor() ERC20("OnlyOne", "Only") {
        _mint(msg.sender, 10 * 10 ** decimals());
    }
}