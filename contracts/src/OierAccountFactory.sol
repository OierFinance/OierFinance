// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IOierAccountInit {
    function initialize(bytes[] calldata config, bool finish) external;
}

/// @title OierAccountFactory
/// @notice Creates an OierAccount for the caller at an address that depends
///         only on (factory, caller, salt), so it can be shown before creation.
///         The account bytecode is passed in by the caller and must hash to
///         `accountCodeHash`, fixed when the factory is deployed, so the factory
///         can only ever create genuine OierAccounts. It keeps no rights over
///         the accounts it creates.
/// @dev    UNAUDITED. Passing the bytecode in keeps the factory far below the
///         24 KB contract size limit.
contract OierAccountFactory {
    bytes32 public immutable accountCodeHash;

    event AccountCreated(address indexed account, address indexed owner, bytes32 salt);

    error WrongCode();
    error CreateFailed();

    constructor(bytes32 accountCodeHash_) {
        accountCodeHash = accountCodeHash_;
    }

    /// @notice Create an account owned by the caller, with its first rules applied.
    /// @param code OierAccount creation bytecode (must match accountCodeHash)
    /// @param config rule-change calls (IOierRules encodings) applied at creation
    /// @param finish end setup mode at once, so later loosening waits for guards
    function createAccount(bytes calldata code, bytes32 salt, bytes[] calldata config, bool finish)
        external
        returns (address account)
    {
        if (keccak256(code) != accountCodeHash) revert WrongCode();
        bytes memory init = abi.encodePacked(code, abi.encode(msg.sender));
        bytes32 s = keccak256(abi.encode(msg.sender, salt));
        assembly {
            account := create2(0, add(init, 32), mload(init), s)
        }
        if (account == address(0)) revert CreateFailed();
        IOierAccountInit(account).initialize(config, finish);
        emit AccountCreated(account, msg.sender, salt);
    }

    /// @notice Address `owner` gets for `salt` (bytecode supplied for the hash).
    function predict(bytes calldata code, address owner, bytes32 salt) external view returns (address) {
        if (keccak256(code) != accountCodeHash) revert WrongCode();
        bytes32 initHash = keccak256(abi.encodePacked(code, abi.encode(owner)));
        bytes32 s = keccak256(abi.encode(owner, salt));
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), address(this), s, initHash)))));
    }
}
