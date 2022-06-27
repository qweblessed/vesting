import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { OnlyOneAirdrop__factory, SignatureVesting, SignatureVesting__factory, ERC20 } from "../typechain";
import keccak256 from 'keccak256';

describe("SignatureVesting", function () {
  let erc20 : ERC20;
  let vesting : SignatureVesting;
  let defaultVestingBalance : BigNumber;
  
  beforeEach(async () => {
    let [signer] = await ethers.getSigners();
    erc20 = await new OnlyOneAirdrop__factory(signer).deploy();
    vesting = await new SignatureVesting__factory(signer).deploy(erc20.address);
    defaultVestingBalance = (await erc20.balanceOf(await signer.getAddress())).div(2);

    await erc20.transfer(vesting.address, defaultVestingBalance);
  })
  
  it("Should emit Vest event with correct data when vesting tokens", async function () {
    let address2 = await ethers.provider.getSigner(1).getAddress();
    let address3 = await ethers.provider.getSigner(2).getAddress();
    console.log('div',defaultVestingBalance.div(2));
    console.log('addre',address3)
    let message2 = ethers.utils.solidityPack(["address", "uint256", "uint256", "address"], ['0xdA0Fb2305EEad572fEAe4ee8C058C75760D49154', '2500000000000000000', 0,'0xb2D6cBAce476C59F90E86d75a010686373aB5C8C']);
    let message3 = ethers.utils.solidityPack(["address", "uint256", "uint256", "address"], [address3, defaultVestingBalance.div(3), 0, vesting.address]);
    
    let signature2 = await (await ethers.provider.getSigner(0)).signMessage(keccak256(message2)); // owner signs the message
    let signature3 = await (await ethers.provider.getSigner(0)).signMessage(keccak256(message3));
    console.log('message2',signature2)
    console.log('msg3',message3)

  });
});