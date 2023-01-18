// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./interface/ID4AOwnerProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract NaiveOwner is Initializable, ID4AOwnerProxy, AccessControlUpgradeable{
    mapping (bytes32 => address) public ownerMap;
    bytes32 public constant INITIALIZER_ROLE= keccak256("INITIALIZAER_ROLE");
    address placeholder; //for future use

    function initialize() public initializer{
      __AccessControl_init();
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function ownerOf(bytes32 hash) public view returns (address){
      require(ownerMap[hash]!=address(0),"NaiveOwner: This hash doesn't exist");
      return ownerMap[hash];
    }

    function initOwnerOf(bytes32 hash, address owner) external onlyRole(INITIALIZER_ROLE) returns(bool){
      require(ownerMap[hash] == address(0x0), "NaiveOwner: Already initialized");
      ownerMap[hash]=owner;
      return true;
    }
    function transferOwnership (bytes32 hash, address newOwner) external{
      require(ownerMap[hash]!=address(0),"NaiveOwner: This hash doesn't exist");
      require(ownerMap[hash]==msg.sender,"NaiveOwner: The caller is not the owner");
      ownerMap[hash]=newOwner;
    }
}
