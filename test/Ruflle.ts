import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { OnlyOneAirdrop__factory, Ruffle, Ruffle__factory, ERC20 } from "../typechain";
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

describe("RaffleVesting", function () {
  let erc20 : ERC20;
  let vesting : Ruffle;
  let merkleVestingBalance : BigNumber;
  
  beforeEach(async () => {
    let [signer] = await ethers.getSigners();
    erc20 = await new OnlyOneAirdrop__factory(signer).deploy();

    vesting = await new Ruffle__factory(signer).deploy();

    merkleVestingBalance = (await erc20.balanceOf(await signer.getAddress())).div(2);


  })
  
  it("Should create merkleTree", async function () {
    let address2 = await ethers.provider.getSigner(1).getAddress();
    let address3 = await ethers.provider.getSigner(2).getAddress();
    let address4 = await ethers.provider.getSigner(3).getAddress();

    let vestData1 = ethers.utils.solidityPack(["address"], [address2]);
    let vestData2 = ethers.utils.solidityPack(["address"], ['0xaE036c65C649172b43ef7156b009c6221B596B8b']);
    console.log('2',address2)
    console.log('3',address3)

    console.log(vestData1);
    console.log(vestData2);

    let merkleTree = new MerkleTree([vestData1, vestData2], keccak256, { hashLeaves: true, sortPairs: true });
    console.log('merkleRoot',merkleTree.getHexRoot())
    let vestTx = await vesting.vestTokens(merkleTree.getHexRoot());
    vestTx.wait()
    console.log('merkleProof',merkleTree.getHexProof(keccak256(vestData2)))
    console.log(await vesting.canDeposit(merkleTree.getHexProof(keccak256(vestData2)),'0xaE036c65C649172b43ef7156b009c6221B596B8b'))
  });
});