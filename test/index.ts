import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { OnlyOneAirdrop__factory, VestingWithSignature__factory, VestingWithSignature, ERC20 } from "../typechain";
import keccak256 from 'keccak256';

describe("SignatureVesting", function () {
  let erc20 : ERC20;
  let vesting : VestingWithSignature;
  let defaultVestingBalance : BigNumber;
  
  beforeEach(async () => {
    
    let [owner] = await ethers.getSigners();
    console.log('owner',await owner.getAddress())
    erc20 = await new OnlyOneAirdrop__factory(owner).deploy();
    vesting = await new VestingWithSignature__factory(owner).deploy(erc20.address);
    defaultVestingBalance = (await erc20.balanceOf(await owner.getAddress()));  

    console.log('start balance = ',ethers.utils.formatEther(defaultVestingBalance))

    await erc20.transfer(vesting.address, defaultVestingBalance);
  })
  
  it("Should emit Vest event with correct data when vesting tokens", async function () {
    let claimer = await ethers.provider.getSigner(2)
    let claimerAddress = await claimer.getAddress();
    console.log(claimerAddress)

    let message = ethers.utils.solidityPack(["address", "uint256", "uint256", "address"], [claimerAddress, defaultVestingBalance.div(10), 1 , vesting.address]);
    console.log(await ethers.provider.getSigner(0).getAddress())
    console.log('msg',message)

    let signature = await ethers.provider.getSigner(0).signMessage(keccak256(message))
    console.log('sig',signature)
    let claimingTx = await vesting.connect(claimer).claimTokens(defaultVestingBalance.div(10),1,signature)
    claimingTx.wait()

    console.log('claimerTokenBal',await erc20.balanceOf(claimerAddress))

  });
});