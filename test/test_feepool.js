const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const D4AFeePool = artifacts.require("D4AFeePool")
const D4AFeePoolFactory = artifacts.require("D4AFeePoolFactory")
const D4AERC20Factory = artifacts.require("D4AERC20Factory")
const D4AERC20 = artifacts.require("D4AERC20")

contract("D4AFeePool", function (accounts){
  let factory = {}
  let erc20_factory = {}
  let pool = {}
  let erc20 = {}

  context("test", async() =>{
    it('init', async()=>{
      factory = await D4AFeePoolFactory.deployed()
      erc20_factory = await D4AERC20Factory.deployed()

      tx = await erc20_factory.createD4AERC20("test", "TST", accounts[0])
      erc20 = await D4AERC20.at(tx.logs[tx.logs.length-1].args.addr)
      assert.ok(erc20)
    })

    it('create feepool', async() =>{
      admin = await factory.proxy_admin()

      tx = await factory.createD4AFeePool("test fee pool", {from:accounts[0]});
      e = tx.logs[tx.logs.length-1]
      pool = await D4AFeePool.at(e.args.proxy)
    })
    it('test pool admin', async()=>{
      await expectRevert(pool.transfer("0x0000000000000000000000000000000000000000", accounts[0], 1, {from:accounts[1]}), "only admin or auto transfer can call this");
      await expectRevert(pool.transfer("0x0000000000000000000000000000000000000000", accounts[0], 1, {from:accounts[0]}), "transfer eth failed");
      await expectRevert.unspecified(pool.changeAdmin(accounts[1], {from:accounts[1]}))
      await pool.changeAdmin(accounts[1], {from:accounts[0]})
      await pool.changeAdmin(accounts[0], {from:accounts[1]})
    })

    it('test eth transfer', async()=>{
      await pool.sendTransaction({from:accounts[0],value:web3.utils.toWei('0.1', 'ether')})
      t1 = await web3.eth.getBalance(pool.address)
      expect(t1).to.equal('100000000000000000')

      //before = Number(await web3.eth.getBalance(accounts[9]))
      before = new BN(await web3.eth.getBalance(accounts[9]))
      console.log(typeof(before))

      await pool.transfer("0x0000000000000000000000000000000000000000", accounts[9], web3.utils.toWei('0.01', 'ether'), {from:accounts[0]})
      //after = Number(await web3.eth.getBalance(accounts[9]))
      after = new BN(await web3.eth.getBalance(accounts[9]))

      console.log("str:",(after.sub(before)).toString())
      expect((after.sub(before)).toString()).to.equal(await web3.utils.toWei('0.01', 'ether'))
      t1 = await web3.eth.getBalance(pool.address)
      expect(t1).to.equal('90000000000000000')
    })

    it('test erc20 transfer', async()=>{
      await erc20.mint(pool.address, "10000000000", {from:accounts[0]})
      pool_before = Number(await erc20.balanceOf(pool.address))
      addr_before = Number(await erc20.balanceOf(accounts[0]))
      await pool.transfer(erc20.address, accounts[0], '5000000000')
      pool_after = Number(await erc20.balanceOf(pool.address))
      addr_after = Number(await erc20.balanceOf(accounts[0]))
      expect(pool_before).to.equal(pool_after + Number('5000000000'))
      expect(addr_before + Number('5000000000')).to.equal(addr_after)
    })

  })
})
