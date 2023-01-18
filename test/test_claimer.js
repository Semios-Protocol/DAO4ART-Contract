const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const D4AProtocol = artifacts.require("D4AProtocol")
const D4ACreateProjectProxy = artifacts.require("D4ACreateProjectProxy")
const D4ASetting = artifacts.require("D4ASetting")
const DummyPRB = artifacts.require("DummyPRB")
const D4AERC20 = artifacts.require("D4AERC20")
const D4AClaimer = artifacts.require("D4AClaimer")

const {StepRecorder} = require("../util.js");

contract("D4AProtocol for Price", function(accounts){
  context('basic test', async()=>{
    let protocol = {}
    let project_proxy = {}
    let setting = {}
    let PRB = {}
    let project1_id = {}
    let project1_fee_pool = {}
    let project1_erc20_token = {}
    let project1_erc721_token = {}
    let project2_id = {}
    let project2_fee_pool = {}
    let project2_erc20_token = {}
    let project2_erc721_token = {}
    let canvas1_id = {}
    let canvas1_owner = {}
    let canvas2_owner = {}
    let canvas2_id = {}
    let project_owner = {}
    let claimer = {}
    let protocol_pool = {}
    let erc20_total_supply = {}
    let rf = 750

    it("init", async()=>{
      sr = StepRecorder('ganache', 'd4a')
      protocol = await D4AProtocol.at(sr.read('protocol'))
      project_proxy = await D4ACreateProjectProxy.at(sr.read('project_proxy'))
      setting = await D4ASetting.at(sr.read("setting"))
      claimer = await D4AClaimer.at(sr.read("claimer"))
      protocol_pool = await setting.protocol_fee_pool();
      console.log("protocol fee pool: ", protocol_pool)
      erc20_total_supply = await setting.erc20_total_supply()
      console.log('total supply', erc20_total_supply)
      PRB = await DummyPRB.at(await setting.PRB())
      PRB.changeRound(0)
    })

    it('create project', async() =>{
      tx = await project_proxy.createProject(5, 50, 1, 1, rf, "uri here 1", {from:accounts[0], value:'1000000000000000000'});
      e = tx.logs[3]
      project1_id = e.args.project_id;
      project1_erc20_token = await D4AERC20.at(e.args.erc20_token);
      project1_erc721_token = e.args.erc721_token;
      project1_fee_pool = e.args.fee_pool;
      project_owner = accounts[0]

      tx = await project_proxy.createProject(5, 50, 1, 1, rf, "uri here 2", {from:accounts[0], value:'1000000000000000000'});
      e = tx.logs[3]
      project2_id = e.args.project_id;
      project2_erc20_token = await D4AERC20.at(e.args.erc20_token);
      project2_erc721_token = e.args.erc721_token;
      project2_fee_pool = e.args.fee_pool;
      project_owner = accounts[0]

      PRB.changeRound(5)
    })
    it('create canvas1', async() =>{
      tx = await protocol.createCanvas(project1_id, "canvas uri 2", {from:accounts[0], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas1_id = e.args.canvas_id;
    })

    it('create canvas2', async() =>{
      tx = await protocol.createCanvas(project1_id, "canvas uri 3", {from:accounts[0], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas2_id = e.args.canvas_id;
    })

    it('create canvas3', async() =>{
      tx = await protocol.createCanvas(project2_id, "canvas uri 4", {from:accounts[0], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas3_id = e.args.canvas_id;
    })
    it('claim all', async()=>{
      owner_before = new BN(await web3.eth.getBalance(project_owner))

      tx = await protocol.mintNFT(canvas1_id, "token uri 1", {from:accounts[1], value:'50000000000000000'});
      tx = await protocol.mintNFT(canvas1_id, "token uri 2", {from:accounts[1], value:'100000000000000000'});
      tx = await protocol.mintNFT(canvas2_id, "token uri 3", {from:accounts[1], value:'200000000000000000'});
      tx = await protocol.mintNFT(canvas3_id, "token uri 4", {from:accounts[1], value:'50000000000000000'});
      PRB.changeRound(6)

      console.log("poo1:", await web3.eth.getBalance(project1_fee_pool))
      console.log("poo2:", await web3.eth.getBalance(project2_fee_pool))


      owner_before = new BN(await web3.eth.getBalance(project_owner))
      projects = [project1_id, project2_id]
      canvas = [canvas1_id, canvas2_id, canvas3_id]
      console.log(projects)
      console.log(canvas)
      tx = await claimer.claimMultiRewardWithETH(canvas, projects, {from:accounts[1]});
      owner_after = new BN(await web3.eth.getBalance(project_owner))
      bal = (owner_after.sub(owner_before)).toString()
      console.log("bal:", bal)
      expect(bal).to.equal("102900000000000000")
      //expect((owner_after.sub(owner_before)).toString()).to.equal("0")

    })




  })
})
