const { expect } = require("chai");
const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("openzeppelin-test-helpers");
const { web3 } = require("openzeppelin-test-helpers/src/setup.js");
const D4AProtocol = artifacts.require("D4AProtocol");
const D4ASetting = artifacts.require("D4ASetting");
const DummyPRB = artifacts.require("DummyPRB");
const D4ACreateProjectProxy = artifacts.require("D4ACreateProjectProxy");
const WETH = artifacts.require("WETH9");
const Splitter = artifacts.require("D4ARoyaltySplitter");
const ERC20Test = artifacts.require("ERC20Test");

const { StepRecorder } = require("../util.js");

contract("D4ASplitter", function (accounts) {
  let protocol = {};
  let setting = {};
  let PRB = {};
  let cproxy = {};
  let project_id = {};
  let project_fee_pool = {};
  let project_erc20_token = {};
  let project_erc721_token = {};
  let splitter = {};
  let rf = 750;

  context("basic test", async () => {
    it("init", async () => {
      sr = StepRecorder("ganache", "d4a");
      protocol = await D4AProtocol.at(sr.read("protocol"));
      setting = await D4ASetting.at(sr.read("setting"));
      PRB = await DummyPRB.at(await setting.PRB());
      cproxy = await D4ACreateProjectProxy.at(sr.read("project_proxy"));
      weth = await WETH.at(sr.read("WETH"));
      await setting.changeWETHAddress(weth.address);
      erc20Test = await ERC20Test.at(sr.read("ERC20Test"));
    });

    it("create project", async () => {
      console.log("cproy: ", cproxy.address);
      tx = await cproxy.createProject(1, 60, 1, 1, rf, "uri here", { from: accounts[0], value: "1000000000000000000", });
      console.log("logs:", tx.logs);
      e = tx.logs[3];
      console.log("e:", e);
      project_id = e.args.project_id;
      console.log("id:", project_id);
      project_erc20_token = e.args.erc20_token;
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
      splitter = await cproxy.getSplitterAddress(project_id);

      console.log(
        "Project_fee_pool before: ",
        await web3.eth.getBalance(accounts[9])
      );

      await web3.eth.sendTransaction({
        from: accounts[0],
        to: splitter,
        value: web3.utils.toWei("100", "ether"),
      });
      console.log("split_bal: ", await web3.eth.getBalance(splitter));
      console.log(
        "Protocol_fee_pool: ",
        await web3.eth.getBalance(accounts[9])
      );
      console.log(
        "Project_fee_pool: ",
        await web3.eth.getBalance(project_fee_pool)
      );
    });

    it("should split WETH", async () => {
      // console.log("cproy: ", cproxy.address);
      tx = await cproxy.createProject(1, 60, 1, 1, rf, "uri here1", { from: accounts[0], value: "1000000000000000000", });
      // console.log("logs:", tx.logs);
      e = tx.logs[3];
      // console.log("e:", e);
      project_id = e.args.project_id;
      // console.log("id:", project_id);
      project_erc20_token = e.args.erc20_token;
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
      splitter = await cproxy.getSplitterAddress(project_id);

      await weth.deposit({
        from: accounts[0],
        value: web3.utils.toWei("100", "ether"),
      });
      await weth.transfer(splitter, await web3.utils.toWei("100", "ether"), {
        from: accounts[0],
      });
      console.log("splitter WETH bal: ", await weth.balanceOf(splitter).then((res) => res.toString()) / 10**18)
      splitter_contract = await Splitter.at(splitter);
      await splitter_contract.claimWETH();
      console.log("split_bal: ", await web3.eth.getBalance(splitter));
      console.log(
        "Protocol_fee_pool: ",
        await web3.eth.getBalance(accounts[9])
      );
      console.log(
        "Project_fee_pool: ",
        await web3.eth.getBalance(project_fee_pool)
      );
    });

    it("should split ERC20", async () => {
      // console.log("cproy: ", cproxy.address);
      tx = await cproxy.createProject(1, 60, 1, 1, rf, "uri here2", { from: accounts[0], value: "1000000000000000000", });
      // console.log("logs:", tx.logs);
      e = tx.logs[3];
      // console.log("e:", e);
      project_id = e.args.project_id;
      // console.log("id:", project_id);
      project_erc20_token = e.args.erc20_token;
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
      splitter = await cproxy.getSplitterAddress(project_id);

      await erc20Test.transfer(splitter, await web3.utils.toWei("1", "ether"));
      console.log("splitter ERC20 bal: ", await erc20Test.balanceOf(splitter).then((res) => res.toString()) / 10**18)
      splitter_contract = await Splitter.at(splitter);
      await splitter_contract.claimERC20(erc20Test.address);
      console.log("split_bal: ", await erc20Test.balanceOf(splitter).then((res) => res.toString()));
      console.log(
        "Protocol_fee_pool: ",
        await erc20Test.balanceOf(accounts[9]).then((res) => res.toString())
      );
      console.log(
        "Project_fee_pool: ",
        await erc20Test.balanceOf(project_fee_pool).then((res) => res.toString())
      );
    });
  });
});
