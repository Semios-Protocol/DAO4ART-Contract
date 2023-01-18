const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const D4AProtocol = artifacts.require("D4AProtocol")
const D4ACreateProjectProxy = artifacts.require("D4ACreateProjectProxy")
const D4ASetting = artifacts.require("D4ASetting")
const DummyPRB = artifacts.require("DummyPRB")

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
    let canvas2_id = {}
    let rf = 750
    it("init", async()=>{
      sr = StepRecorder('ganache', 'd4a')
      protocol = await D4AProtocol.at(sr.read('protocol'))
      project_proxy = await D4ACreateProjectProxy.at(sr.read('project_proxy'))
      setting = await D4ASetting.at(sr.read("setting"))
      PRB = await DummyPRB.at(await setting.PRB())
      PRB.changeRound(0)
    })
    it('create project', async() =>{
      tx = await project_proxy.createProject(5, 60, 1, 1, rf, "uri here 1", {from:accounts[0], value:'1000000000000000000'});
      e = tx.logs[3]
      project_id = e.args.project_id;
      project_erc20_token = e.args.erc20_token;
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
      await PRB.changeRound(5);
    })
    it('create canvas1', async() =>{
      tx = await protocol.createCanvas(project_id, "canvas uri 2", {from:accounts[0], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas1_id = e.args.canvas_id;
    })
    it('create canvas2', async() =>{
      tx = await protocol.createCanvas(project_id, "canvas uri 3", {from:accounts[0], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas2_id = e.args.canvas_id;
    })
    it('test basic price in current block', async()=>{
      p1 = await protocol.getCanvasNextPrice(canvas2_id);
      expect(p1.toString()).to.equal('50000000000000000')
    })

    it('price should not downgrade a rank in next block', async()=>{
      await PRB.changeRound(6)
      p1 = await protocol.getCanvasNextPrice(canvas2_id);
      expect(p1.toString()).to.equal('25000000000000000')
    })
    it('mint NFT in canvas1 and check after price', async()=>{
      await PRB.changeRound(7)
      tx = await protocol.mintNFT(canvas1_id, "token uri 4", {from:accounts[0], value:'25000000000000000'});
      price = tx.logs[tx.logs.length-1].args.price
      expect(price.toString()).to.equal('25000000000000000')

      p1 = await protocol.getCanvasNextPrice(canvas1_id);
      expect(p1.toString()).to.equal('50000000000000000')
      p1 = await protocol.getCanvasNextPrice(canvas2_id);
      expect(p1.toString()).to.equal('50000000000000000')
    })

    it('mint again and price should double', async()=>{
      tx = await protocol.mintNFT(canvas1_id, "token uri 5", {from:accounts[0], value:'50000000000000000'});
      price = tx.logs[tx.logs.length-1].args.price
      expect(price.toString()).to.equal('50000000000000000')

      tx = await protocol.mintNFT(canvas1_id, "token uri6", {from:accounts[0], value:'100000000000000000'});
      price = tx.logs[tx.logs.length-1].args.price
      expect(price.toString()).to.equal('100000000000000000')

      tx = await protocol.mintNFT(canvas1_id, "token uri7", {from:accounts[0], value:'200000000000000000'});
      price = tx.logs[tx.logs.length-1].args.price
      expect(price.toString()).to.equal('200000000000000000')

      p1 = await protocol.getCanvasNextPrice(canvas2_id);
      expect(p1.toString()).to.equal('50000000000000000')
    })
    it('change round and price should go back to floor price', async()=>{
      await PRB.changeRound(8)
      p1 = await protocol.getCanvasNextPrice(canvas1_id);
      expect(p1.toString()).to.equal('200000000000000000')
      await PRB.changeRound(9)
      p1 = await protocol.getCanvasNextPrice(canvas1_id);
      expect(p1.toString()).to.equal('100000000000000000')
      await PRB.changeRound(10)
      p1 = await protocol.getCanvasNextPrice(canvas1_id);
      expect(p1.toString()).to.equal('50000000000000000')

      p1 = await protocol.getCanvasNextPrice(canvas2_id);
      expect(p1.toString()).to.equal('50000000000000000')

      await PRB.changeRound(11)
      p1 = await protocol.getCanvasNextPrice(canvas1_id);
      expect(p1.toString()).to.equal('25000000000000000')
      p1 = await protocol.getCanvasNextPrice(canvas2_id);
      expect(p1.toString()).to.equal('25000000000000000')
    })
    it('first prb rich floor price, next prb should keep floor price', async()=>{
      await PRB.changeRound(15)
      tx = await protocol.mintNFT(canvas1_id, "token uri15", {from:accounts[0], value:'250000000000000000'});
      await PRB.changeRound(16)
      p1 = await protocol.getCanvasNextPrice(canvas1_id);
      expect(p1.toString()).to.equal('50000000000000000')

    })
  })
})
