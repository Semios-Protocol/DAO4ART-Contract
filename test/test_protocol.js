const { expect } = require('chai');
const { ethers } = require("ethers");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ether = require('openzeppelin-test-helpers/src/ether.js');
const D4AProtocol = artifacts.require("D4AProtocol")
const D4ACreateProjectProxy = artifacts.require("D4ACreateProjectProxy")
const D4ASetting = artifacts.require("D4ASetting")
const DummyPRB = artifacts.require("DummyPRB")

const {StepRecorder} = require("../util.js");


contract("D4AProtocol", function(accounts){
  let protocol = {}
  let project_proxy = {}
  let setting = {}
  let PRB = {}
  let project_id = {}
  let project_fee_pool = {}
  let project_erc20_token = {}
  let project_erc721_token = {}
  let canvas_id = {}
  let rf = 750
  context('basic test', async()=>{
    it("init", async()=>{
      sr = StepRecorder('ganache', 'd4a')
      project_proxy = await D4ACreateProjectProxy.at(sr.read('project_proxy'))
      protocol = await D4AProtocol.at(sr.read('protocol'))
      setting = await D4ASetting.at(sr.read("setting"))
      PRB = await DummyPRB.at(await setting.PRB())
    })

    it('create project with less ether', async() =>{
      await expectRevert(project_proxy.createProject(1, 60, 1, 1, rf, "uri here"), 'not enough ether to create project');
    })
    it('create project with high rank', async() =>{
      await expectRevert(project_proxy.createProject(1, 60, 8, 1, rf, "uri here", {from:accounts[0], value:'1000000000000000000'}), 'invalid floor price rank');
    })

    it('create project', async() =>{
      tx = await project_proxy.createProject(1, 60, 1, 1, rf, "uri here", {from:accounts[0], value:'1000000000000000000'});
      // console.log("logs:",tx.logs)
      e = tx.logs[3]
      // console.log("e:",e)
      project_id = e.args.project_id;
      console.log("id:",project_id)
      project_erc20_token = e.args.erc20_token;
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
    })
    it('create canvas with fail', async() =>{
      await expectRevert(protocol.createCanvas(project_id, "canvas uri"), "project not start yet");
      await PRB.changeRound(1);
      await expectRevert(protocol.createCanvas(project_id, "canvas uri"), "not enough ether to create canvas");
    })
    it('create canvas', async() =>{
      tx = await protocol.createCanvas(project_id, "canvas uri", {from:accounts[0], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas_id = e.args.canvas_id;
    })
    it('mint with fail', async() =>{
      await expectRevert(protocol.mintNFT(canvas_id, "token uri"), "not enough ether to mint NFT")
    })
    it('mint NFT', async() =>{
      tx = await protocol.mintNFT(canvas_id, "token uri", {from:accounts[0], value:'50000000000000000'})
    })

  })

  context("Test createProject as users or admin", async () => {
    it("init", async () => {
      sr = StepRecorder("ganache", "d4a");
      project_proxy = await D4ACreateProjectProxy.at(sr.read('project_proxy'))
      setting = await D4ASetting.at(sr.read("setting"));
      PRB = await DummyPRB.at(await setting.PRB());
      setting.grantRole(await setting.OPERATION_ROLE(), accounts[0], {
        from: accounts[0],
      });
    });

    it("Should create project as admin with 0 as project_index", async () => {
      tx = await project_proxy.methods[
        "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
      ](1, 60, 1, 1, rf, "uri 0", 0, {
        from: accounts[0],
        value: "1000000000000000000",
      });
    });

    it("Should create project as admin with 109 as project_index", async () => {
      tx = await project_proxy.methods[
        "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
      ](1, 60, 1, 1, rf, "uri 109", 109, {
        from: accounts[0],
        value: "1000000000000000000",
      });
    });

    // enumerate 0 to 109 with random order
    it("Should create project as admin with 1 to 109 as project_index", async () => {
      function fisherYatesShuffle(array) {
        let currentIndex = array.length;
        let temporaryValue, randomIndex;

        while (currentIndex !== 0) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
        }
        return array;
      }

      const numbers = Array.from({ length: 110 }, (_, i) => i);
      const shuffledNumbers = fisherYatesShuffle(numbers);
      // console.log(shuffledNumbers);
      for (num in shuffledNumbers) {
        if (num == 0 || num == 109) continue;
        tx = await project_proxy.methods[
          "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
        ](1, 60, 1, 1, rf, "uri " + num, num, {
          from: accounts[0],
          value: "1000000000000000000",
        });
      }
      console.log(await protocol.project_bitmap().then(x => x.toString()));
    });

    it("Should fail to create project as admin if not in OPERATION_ROLE", async () => {
      await expectRevert(
        project_proxy.methods[
          "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
        ](1, 60, 1, 1, rf, "uri fail1", 0, {
          from: accounts[1],
          value: "1000000000000000000",
        }),
        "only admin can specify project index"
      );
    });

    it("Should fail to create project as admin if project_index not in [0..=109]", async () => {
      await expectRevert(
        project_proxy.methods[
          "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
        ](1, 60, 1, 1, rf, "uri fail2", 110, {
          from: accounts[0],
          value: "1000000000000000000",
        }),
        "INDEX_ERROR: project index too large"
      );
    });

    it("Should fail to create project as admin if project_index not in [0..=109]", async () => {
      index = ethers.BigNumber.from(2).pow(256).sub(1);
      await expectRevert(
        project_proxy.methods[
          "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
        ](1, 60, 1, 1, rf, "uri fail3", index, {
          from: accounts[0],
          value: "1000000000000000000",
        }),
        "INDEX_ERROR: project index too large"
      );
    });

    it("Should fail to create project as admin if project_index already exists", async () => {
      await expectRevert.unspecified(
        project_proxy.methods[
          "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
        ](1, 60, 1, 1, rf, "uri fail4", 109, {
          from: accounts[0],
          value: "1000000000000000000",
        }),
        "INDEX_ERROR: project index already exists"
      );
    });

    it("Should create project as user", async () => {
      tx = await project_proxy.methods[
        "createProject(uint256,uint256,uint256,uint256,uint96,string)"
      ](1, 60, 1, 1, rf, "uri user", {
        from: accounts[1],
        value: "1000000000000000000",
      });
    });
  });

  context("Test createProject using protocol contract instead of createProjectProxy contract", async () => {
    it("init", async () => {
      sr = StepRecorder("ganache", "d4a");
      project_proxy = await D4ACreateProjectProxy.at(sr.read('project_proxy'))
      setting = await D4ASetting.at(sr.read("setting"));
      PRB = await DummyPRB.at(await setting.PRB());
      setting.grantRole(await setting.OPERATION_ROLE(), accounts[0], {
        from: accounts[0],
      });
    });

    it("Should revert if create user project", async () => {
      await expectRevert(
        protocol.methods[
          "createProject(uint256,uint256,uint256,uint256,uint96,string)"
        ](1, 60, 1, 1, rf, "uri fail5", {
          from: accounts[1],
          value: "1000000000000000000",
        }),
        "only project proxy can call protocol"
      );
    });

    it("Should revert if create owner project", async () => {
      await expectRevert(
        protocol.methods[
          "createOwnerProject(uint256,uint256,uint256,uint256,uint96,string,uint256)"
        ](1, 60, 1, 1, rf, "uri fail6", 0, {
          from: accounts[0],
          value: "1000000000000000000",
        }),
        "only project proxy can call protocol"
      );
    });
  });
})
