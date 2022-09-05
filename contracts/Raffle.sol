//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";


import "hardhat/console.sol";

abstract contract IERC20Extented is IERC20 {
    function decimals() public virtual returns (uint8);
}

contract Ruffle is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    event Winner(address _winner);

    struct Pool {
        address tokenAddress;
        uint256 depositedTokenAmount;
        address actor;
    }

    struct UserEntracy {
        uint256 poolId;
        bool hasEntered;
    }

    bytes32 public allowedTokensMerkleRoot;
    bytes32 keyHash = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;

    Pool[] public betsPool;
    mapping (address => UserEntracy) participants;
    address vrfCoordinator = 0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D;

    uint64 s_subscriptionId;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords =  1;
    
    uint256[] public s_randomWords;
    uint256 public s_requestId;
    uint256 public _lastPoolId;
    uint256 public poolSize = 150;
    address s_owner;

    constructor() VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_owner = msg.sender;
        s_subscriptionId = 281;
    }

    function requestRandomWords() public onlyOwner {
        s_requestId = COORDINATOR.requestRandomWords(
        keyHash,
        s_subscriptionId,
        requestConfirmations,
        callbackGasLimit,
        numWords
        );
    }
    function logRandomNumber(uint256 numberOfParticipants) public view returns(uint256){
        
        uint256 randomNumber = s_randomWords[0] % numberOfParticipants + 1 ;
        return randomNumber;
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        s_randomWords = randomWords;
    }

    function deposit(uint256 amount,address erc20, bytes32[] calldata merkleProof) external {
        UserEntracy storage actor = participants[msg.sender];

        uint256 decimals = IERC20Extented(erc20).decimals();
        uint256 tokenSupply = IERC20Extented(erc20).totalSupply();

        // require(totalSupply /( 10 ** decimals),; todo it 
       
        require(canDeposit(merkleProof,erc20), "not allowed token");
        require(actor.hasEntered && actor.poolId == _lastPoolId,"not allowed to re-enter");
        require(betsPool.length >= poolSize,"poolSize limit");

        IERC20Extented(erc20).approve(address(this),amount);
        IERC20Extented(erc20).transferFrom(msg.sender,address(this), amount);
        
        participants[msg.sender] = UserEntracy(
            _lastPoolId,
            true
        );

        betsPool.push(Pool(erc20,amount,msg.sender));  
    }
    
    function setAllowlist(bytes32 merkleRoot) public onlyOwner {
        allowedTokensMerkleRoot = merkleRoot;

    }

    function canDeposit(bytes32[] calldata merkleProof, address erc20) public view returns (bool) {
        return MerkleProof.verify(merkleProof, allowedTokensMerkleRoot, keccak256(abi.encodePacked(erc20)));
    }

    function spinTheWheel() public onlyOwner {
        requestRandomWords();
        uint256 chooseWinnerIndex = logRandomNumber(betsPool.length);
        address winner = betsPool[chooseWinnerIndex].actor;

        for(uint256 i; i < betsPool.length; i++){
            Pool memory token = betsPool[i];

            IERC20Extented(token.tokenAddress).transferFrom(address(this), winner, token.depositedTokenAmount);
            
        }

        delete betsPool;

        emit Winner(winner);
    }

    modifier onlyOwner() {
        require(msg.sender == s_owner);
        _;
    }
    
}
