// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;
import "../interface/ID4APRB.sol";

contract DummyPRB is ID4APRB{
  bool public start;
  uint256 public round;
  constructor(){
    start = true;
    round =  0;
  }

  function changeRound(uint256 _round) public {
    round = _round;
  }

  function isStart() public view returns(bool){
    return start;
  }

  function currentRound() public view returns(uint256){
    return round;
  }

}
