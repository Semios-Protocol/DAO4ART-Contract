const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const D4AProtocol = artifacts.require("D4AProtocol")
const D4ACreateProjectProxy = artifacts.require("D4ACreateProjectProxy")
const D4ASetting = artifacts.require("D4ASetting")
const DummyPRB = artifacts.require("DummyPRB")
const D4AERC20 = artifacts.require("D4AERC20")

const {StepRecorder} = require("../util.js");

contract("D4AProtocol for Price", function(accounts){
  context('basic test', async()=>{
    let protocol = {}
    let project_proxy = {}
    let setting = {}
    let PRB = {}
    let project_id = {}
    let project_fee_pool = {}
    let project_erc20_token = {}
    let project_erc721_token = {}
    let canvas1_id = {}
    let canvas1_owner = {}
    let canvas2_owner = {}
    let canvas2_id = {}
    let project_owner = {}

    let protocol_pool = {}
    let erc20_total_supply = {}
    let rf = 750

    it("init", async()=>{
      sr = StepRecorder('ganache', 'd4a')
      protocol = await D4AProtocol.at(sr.read('protocol'))
      project_proxy = await D4ACreateProjectProxy.at(sr.read('project_proxy'))
      setting = await D4ASetting.at(sr.read("setting"))
      protocol_pool = await setting.protocol_fee_pool();
      console.log("protocol fee pool: ", protocol_pool)
      erc20_total_supply = await setting.erc20_total_supply()
      console.log('total supply', erc20_total_supply)
      PRB = await DummyPRB.at(await setting.PRB())
      PRB.changeRound(0)
    })

    it('create project', async() =>{
      tx = await project_proxy.createProject(5, 50, 1, 1, rf, "uri here 1", {from:accounts[7], value:'1000000000000000000'});
      e = tx.logs[3]
      project_id = e.args.project_id;
      project_erc20_token = await D4AERC20.at(e.args.erc20_token);
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
      await PRB.changeRound(5);
      project_owner = accounts[7]

      console.log("name of ERC20:", await project_erc20_token.name())
    })
    it('create canvas1', async() =>{
      tx = await protocol.createCanvas(project_id, "canvas uri 2", {from:accounts[8], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas1_id = e.args.canvas_id;
      canvas1_owner = accounts[8]
    })

    it('create canvas2', async() =>{
      tx = await protocol.createCanvas(project_id, "canvas uri 3", {from:accounts[6], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas2_id = e.args.canvas_id;
      canvas2_owner = accounts[6]
    })
    it('one mint and claim reward in the same prb should get nothing', async()=>{
      await PRB.changeRound(11)
      console.log("fee bal before mint:", await web3.eth.getBalance(project_fee_pool))
      tx = await protocol.mintNFT(canvas1_id, "token uri 1", {from:accounts[0], value:'25000000000000000'});

      owner_before = new BN(await web3.eth.getBalance(project_owner))
      tx = await protocol.claimProjectERC20RewardWithETH(project_id);
      owner_after = new BN(await web3.eth.getBalance(project_owner))

      expect((owner_after.sub(owner_before)).toString()).to.equal("0")


      p1 = Number(await project_erc20_token.balanceOf(protocol_pool));
      expect(p1).to.equal(0)
      p1 = Number(await project_erc20_token.balanceOf(project_fee_pool));
      expect(p1).to.equal(0)


      owner_before = new BN(await web3.eth.getBalance(canvas1_owner))
      tx = await protocol.claimCanvasRewardWithETH(canvas1_id);
      owner_after = new BN(await web3.eth.getBalance(canvas1_owner))

      owner_before = new BN(await web3.eth.getBalance(project_owner))

      p1 = Number(await project_erc20_token.balanceOf(canvas1_owner));
      expect(p1).to.equal(0)
    })

    it('claim in the next prb should get something', async()=>{
      t = Number(await project_erc20_token.balanceOf(protocol.address))
      console.log("before protocol has erc20: ", t);
      await PRB.changeRound(12)

      owner_before = new BN(await web3.eth.getBalance(project_owner))
      tx = await protocol.claimProjectERC20Reward(project_id);
      owner_after = new BN(await web3.eth.getBalance(project_owner))
      expect((owner_after.sub(owner_before)).toString()).to.equal("0")


      t = Number(await project_erc20_token.balanceOf(protocol.address))
      console.log("protocol has erc20: ", t);
      p1 = Number(await project_erc20_token.balanceOf(protocol_pool));
      expect(p1).to.equal(40000000000000000000)
      p1 = Number(await project_erc20_token.balanceOf(project_owner));
      expect(p1).to.equal(60000000000000000000)
      //tx = await protocol.claimCanvasReward(canvas1_id);
      //p1 = await project_erc20_token.balanceOf(canvas1_owner);
      //expect(p1.toString()).to.equal("1900000000000000000000")

      before = new BN(await web3.eth.getBalance(canvas1_owner))
      console.log("fee bal:", await web3.eth.getBalance(project_fee_pool))// 0.02+0.025*0.3
      //0.0275 * 0.95 = 0.026125,
      await protocol.claimCanvasRewardWithETH(canvas1_id)
      after = new BN(await web3.eth.getBalance(canvas1_owner))
      bal = (after.sub(before)).toString()
      console.log("bal:", bal)
      expect(bal).to.equal('26125000000000000')

    })

    it('two mints in two canvases, and reward should split', async()=>{
      await PRB.changeRound(13)
      console.log("fee bal:", await web3.eth.getBalance(project_fee_pool))
      tx = await protocol.mintNFT(canvas1_id, "token uri 2", {from:accounts[0], value:'100000000000000000'}); //shall get exchange
      tx = await protocol.mintNFT(canvas2_id, "token uri 3", {from:accounts[0], value:'100000000000000000'}); //shall get exchange

      console.log("fee bal after mint:", await web3.eth.getBalance(project_fee_pool))

      owner_before = new BN(await web3.eth.getBalance(accounts[3]))
      await protocol.exchangeERC20ToETH(project_id, "60000000000000000000", accounts[3], {from:project_owner})
      owner_after = new BN(await web3.eth.getBalance(accounts[3]))

      expect((owner_after.sub(owner_before)).toString()).to.equal("825000000000000")

      await PRB.changeRound(14)

      owner_before = new BN(await web3.eth.getBalance(canvas1_owner))
      console.log("feepool before:", await web3.eth.getBalance(project_fee_pool))
      tx = await protocol.claimCanvasRewardWithETH(canvas1_id);
      console.log("feepool after:", await web3.eth.getBalance(project_fee_pool))

      owner_after = new BN(await web3.eth.getBalance(canvas1_owner))
      bal = (owner_after.sub(owner_before)).toString()
      console.log("canvas1 bal:", bal)
      expect(bal).to.equal("7156045751633986")

      //await project_fee_pool.sendTransaction({from:accounts[0],value:web3.utils.toWei('0.1', 'ether')})
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: project_fee_pool,
        value: web3.utils.toWei('0.1', 'ether')
      })


      owner_before = new BN(await web3.eth.getBalance(canvas2_owner))
      tx = await protocol.claimCanvasRewardWithETH(canvas2_id);
      owner_after = new BN(await web3.eth.getBalance(canvas2_owner))
      bal = (owner_after.sub(owner_before)).toString()
      console.log("canvas2 bal:", bal)
      expect(bal).to.equal("104359484868196884")
    })

  })
})
