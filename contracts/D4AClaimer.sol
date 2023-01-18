// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "./interface/ID4AProtocolClaim.sol";

contract D4AClaimer{
    ID4AProtocolClaim protocol;
    constructor(address _protocol){
      protocol = ID4AProtocolClaim(_protocol);
    }

    function claimMultiReward(bytes32[] memory canvas, bytes32[] memory projects) public returns (uint256){
      uint256 amount;
      if (canvas.length > 0){
        for (uint i = 0; i < canvas.length; i++){
          amount += protocol.claimCanvasReward(canvas[i]);
        }
      }
      if (projects.length > 0){
        for (uint i = 0; i < projects.length; i++){
          amount += protocol.claimProjectERC20Reward(projects[i]);
        }
      }
      return amount;
    }

    function claimMultiRewardWithETH(bytes32[] memory canvas, bytes32[] memory projects) public returns (uint256){
      uint256 amount;
      if (canvas.length > 0){
        for (uint i = 0; i < canvas.length; i++){
          amount += protocol.claimCanvasRewardWithETH(canvas[i]);
        }
      }
      if (projects.length > 0){
        for (uint i = 0; i < projects.length; i++){
          amount += protocol.claimProjectERC20RewardWithETH(projects[i]);
        }
      }
      return amount;
    }


}
