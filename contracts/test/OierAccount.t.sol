// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {OierAccount, IOierRules} from "../src/OierAccount.sol";
import {OierAccountFactory} from "../src/OierAccountFactory.sol";

interface Vm {
    function warp(uint256) external;
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function expectRevert(bytes4) external;
    function expectRevert() external;
    function expectRevert(bytes calldata) external;
    function deal(address, uint256) external;
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
    function getCode(string calldata) external returns (bytes memory);
    function assume(bool) external;
}

contract MockToken {
    mapping(address => uint256) public balanceOf;
    uint8 public constant decimals = 6;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

abstract contract Base {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 internal constant OWNER_PK = 0xA11CE;
    uint256 internal constant COSIGNER_PK = 0xB0B;
    address internal owner;
    address internal cosigner;
    address internal g1 = address(0x6001);
    address internal g2 = address(0x6002);
    address internal priya = address(0x9001);
    address internal halden = address(0x9002);
    address internal attacker = address(0xBAD);
    MockToken internal usdg;
    OierAccountFactory internal factory;
    OierAccount internal acct;
    bytes internal code;

    uint256 internal constant DAY_CAP = 1_200e6;
    uint256 internal constant TX_CAP = 3_000e6;
    uint256 internal constant WEEK_CAP = 5_000e6;
    uint256 internal constant COSIGN = 1_000e6;
    uint32 internal constant DEFAULT_DELAY = 2 days;

    uint256 internal T;

    /// via-IR may cache block.timestamp after a warp, so tests keep their own clock.
    function _skip(uint256 d) internal {
        T += d;
        vm.warp(T);
    }

    function assertTrue(bool c, string memory m) internal pure {
        require(c, m);
    }

    function assertEq(uint256 a, uint256 b, string memory m) internal pure {
        require(a == b, m);
    }

    function _rules() internal view returns (bytes[] memory c) {
        address[] memory cos = new address[](1);
        cos[0] = cosigner;
        address[] memory gs = new address[](2);
        gs[0] = g1;
        gs[1] = g2;
        c = new bytes[](8);
        c[0] = abi.encodeCall(IOierRules.setAllowlistOn, (true));
        c[1] = abi.encodeCall(IOierRules.setAllowed, (priya, true));
        c[2] = abi.encodeCall(IOierRules.setAllowed, (halden, true));
        c[3] = abi.encodeCall(IOierRules.setLimits, (address(usdg), TX_CAP, DAY_CAP, WEEK_CAP, COSIGN));
        c[4] = abi.encodeCall(IOierRules.setCosigners, (cos, 1));
        c[5] = abi.encodeCall(IOierRules.setTiming, (6 hours, 0));
        c[6] = abi.encodeCall(IOierRules.setRecovery, (gs, 2, 3 days));
        c[7] = abi.encodeCall(IOierRules.setGuard, (keccak256("oier.default"), DEFAULT_DELAY, 0, false));
    }

    function _setUpAccount() internal {
        T = 1_790_000_000;
        vm.warp(T);
        owner = vm.addr(OWNER_PK);
        cosigner = vm.addr(COSIGNER_PK);
        usdg = new MockToken();
        code = vm.getCode("OierAccount.sol:OierAccount");
        factory = new OierAccountFactory(keccak256(code));
        bytes[] memory cfg = _rules();
        address predicted = factory.predict(code, owner, bytes32("main"));
        vm.prank(owner);
        acct = OierAccount(payable(factory.createAccount(code, bytes32("main"), cfg, true)));
        assertTrue(address(acct) == predicted, "predicted address");
        usdg.mint(address(acct), 100_000e6);
        vm.deal(address(acct), 10 ether);
    }
}

contract OierAccountTest is Base {
    function setUp() public {
        _setUpAccount();
    }

    function test_createdWithRules() public view {
        assertTrue(acct.owner() == owner, "owner");
        assertTrue(!acct.inSetup(), "setup finished");
        assertTrue(acct.allowlistOn() && acct.allowed(priya), "allowlist");
        assertEq(acct.settleDelay(), 6 hours, "delay");
    }

    function test_rejectsWrongBytecode() public {
        vm.expectRevert(OierAccountFactory.WrongCode.selector);
        factory.createAccount(hex"6000", bytes32(0), new bytes[](0), true);
    }

    function test_initializeOnlyOnce() public {
        vm.expectRevert(OierAccount.BadState.selector);
        acct.initialize(new bytes[](0), true);
    }

    function test_allowlistDenies() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(OierAccount.Denied.selector, 2));
        acct.propose(address(usdg), attacker, 10e6);
    }

    function test_blocklistDeniesEvenIfAllowed() public {
        vm.prank(owner);
        acct.configure(abi.encodeCall(IOierRules.setBlocked, (priya, true)));
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(OierAccount.Denied.selector, 1));
        acct.propose(address(usdg), priya, 10e6);
    }

    function test_txCap() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(OierAccount.Denied.selector, 3));
        acct.propose(address(usdg), priya, TX_CAP + 1);
    }

    function test_dayCapIsRolling() public {
        vm.startPrank(owner);
        acct.propose(address(usdg), priya, 700e6);
        _skip(20 hours);
        acct.propose(address(usdg), priya, 500e6);
        vm.expectRevert(abi.encodeWithSelector(OierAccount.Denied.selector, 4));
        acct.propose(address(usdg), priya, 1e6);
        _skip(5 hours); // first one is now outside the 24 buckets
        acct.propose(address(usdg), priya, 600e6);
        vm.stopPrank();
    }

    function test_weekCap() public {
        vm.startPrank(owner);
        for (uint256 i = 0; i < 4; i++) {
            acct.propose(address(usdg), priya, 1_000e6);
            _skip(1 days + 1 hours);
        }
        acct.propose(address(usdg), priya, 1_000e6);
        _skip(1 days + 1 hours);
        vm.expectRevert(abi.encodeWithSelector(OierAccount.Denied.selector, 5));
        acct.propose(address(usdg), priya, 10e6);
        vm.stopPrank();
    }

    function test_delayThenExecute() public {
        vm.prank(owner);
        uint256 id = acct.propose(address(usdg), priya, 200e6);
        vm.expectRevert(OierAccount.NotReady.selector);
        acct.execute(id);
        _skip(6 hours);
        acct.execute(id);
        assertEq(usdg.balanceOf(priya), 200e6, "paid");
    }

    function test_recallRefundsCaps() public {
        vm.startPrank(owner);
        uint256 id = acct.propose(address(usdg), priya, 1_000e6);
        acct.cancelTransfer(id);
        acct.propose(address(usdg), priya, 1_000e6); // fits again after the refund
        vm.stopPrank();
        _skip(7 hours);
        vm.expectRevert(OierAccount.BadState.selector);
        acct.execute(id);
    }

    function test_guardianCanRecall() public {
        vm.prank(owner);
        uint256 id = acct.propose(address(usdg), priya, 100e6);
        vm.prank(g1);
        acct.cancelTransfer(id);
        vm.prank(attacker);
        vm.expectRevert(OierAccount.NotOwner.selector);
        acct.cancelTransfer(id);
    }

    function test_cosignByTransaction() public {
        vm.prank(owner);
        uint256 id = acct.propose(address(usdg), priya, 1_500e6 - 400e6);
        _skip(6 hours);
        vm.expectRevert(OierAccount.NeedsApprovals.selector);
        acct.execute(id);
        vm.prank(cosigner);
        acct.approveTransfer(id);
        acct.execute(id);
        assertEq(usdg.balanceOf(priya), 1_100e6, "paid after cosign");
    }

    function test_cosignBySignature() public {
        vm.prank(owner);
        uint256 id = acct.propose(address(usdg), halden, 1_100e6);
        bytes32 structHash = keccak256(abi.encode(acct.APPROVE_TRANSFER_TYPEHASH(), id, address(usdg), halden, uint256(1_100e6)));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", acct.domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(COSIGNER_PK, digest);
        acct.approveTransferWithSig(id, cosigner, abi.encodePacked(r, s, v));
        _skip(6 hours);
        acct.execute(id);
        assertEq(usdg.balanceOf(halden), 1_100e6, "paid");
        // A signature from someone else is refused.
        vm.prank(owner);
        uint256 id2 = acct.propose(address(usdg), halden, 50e6);
        (v, r, s) = vm.sign(OWNER_PK, digest);
        vm.expectRevert(OierAccount.BadSignature.selector);
        acct.approveTransferWithSig(id2, cosigner, abi.encodePacked(r, s, v));
    }

    function test_newPayeeCooldown() public {
        vm.prank(owner);
        acct.configure(abi.encodeCall(IOierRules.setTiming, (6 hours, 2 days)));
        // Fresh payee added now (loosening: queued behind the default 2-day guard).
        address fresh = address(0x9003);
        vm.prank(owner);
        uint256 cid = acct.configure(abi.encodeCall(IOierRules.setAllowed, (fresh, true)));
        _skip(2 days);
        acct.applyChange(cid);
        vm.prank(owner);
        uint256 id = acct.propose(address(usdg), fresh, 10e6);
        assertTrue(acct.transferAt(id).executeAfter >= T + 2 days, "cooldown applies");
    }

    function test_quietHours() public {
        vm.prank(owner);
        acct.configure(abi.encodeCall(IOierRules.setQuietHours, (true, 23, 7, int32(0))));
        vm.prank(owner);
        uint256 id = acct.propose(address(usdg), priya, 10e6);
        uint64 at = acct.transferAt(id).executeAfter;
        uint256 hour = (uint256(at) / 1 hours) % 24;
        assertTrue(hour >= 7 && hour < 23, "pushed out of quiet hours");
        T = (T / 1 days + 2) * 1 days + 2 hours; // 02:00 UTC
        vm.warp(T);
        vm.expectRevert(OierAccount.QuietHours.selector);
        acct.execute(id);
    }

    function test_lock() public {
        vm.prank(owner);
        acct.configure(abi.encodeCall(IOierRules.setLockUntil, (uint64(T + 10 days))));
        vm.prank(owner);
        uint256 id = acct.propose(address(usdg), priya, 10e6);
        assertTrue(acct.transferAt(id).executeAfter >= T + 10 days, "after lock");
        // A long lock is not instant: it waits for the guard.
        vm.prank(owner);
        uint256 cid = acct.configure(abi.encodeCall(IOierRules.setLockUntil, (uint64(T + 200 days))));
        assertTrue(cid != type(uint256).max, "long lock queued");
    }

    function test_tighteningIsInstantLooseningWaits() public {
        vm.startPrank(owner);
        uint256 a = acct.configure(abi.encodeCall(IOierRules.setLimits, (address(usdg), 1_000e6, 500e6, WEEK_CAP, COSIGN)));
        assertTrue(a == type(uint256).max, "tighten instant");
        uint256 b = acct.configure(abi.encodeCall(IOierRules.setLimits, (address(usdg), 0, 0, 0, 0)));
        assertTrue(b != type(uint256).max, "loosen queued");
        vm.stopPrank();
        vm.expectRevert(OierAccount.NotReady.selector);
        acct.applyChange(b);
        _skip(DEFAULT_DELAY);
        acct.applyChange(b);
        assertEq(acct.limits(address(usdg)).dayCap, 0, "applied after delay");
    }

    function test_stolenKeyCannotAddAttackerBeforeDelay() public {
        // The thief holds the owner key.
        vm.startPrank(owner);
        uint256 cid = acct.configure(abi.encodeCall(IOierRules.setAllowed, (attacker, true)));
        vm.expectRevert(abi.encodeWithSelector(OierAccount.Denied.selector, 2));
        acct.propose(address(usdg), attacker, 1e6);
        vm.stopPrank();
        // A guardian notices and cancels the queued change.
        vm.prank(g2);
        acct.cancelChange(cid);
        _skip(30 days);
        vm.expectRevert(OierAccount.BadState.selector);
        acct.applyChange(cid);
        assertTrue(!acct.allowed(attacker), "attacker never allowed");
    }

    function test_ruleChainFreeze() public {
        bytes32 kAllow = acct.K_ALLOW();
        vm.startPrank(owner);
        // R2: loosening the allowlist needs 1 approval and 7 days (more approvals: queued).
        uint256 c1 = acct.configure(abi.encodeCall(IOierRules.setGuard, (kAllow, 7 days, 1, false)));
        // R3: R2 can never be loosened (freezing also waits for its guard).
        uint256 c2 = acct.configure(abi.encodeCall(IOierRules.setGuard, (acct.guardKey(kAllow), 2 days, 0, true)));
        vm.stopPrank();
        _skip(DEFAULT_DELAY);
        acct.applyChange(c1);
        acct.applyChange(c2);
        vm.prank(owner);
        vm.expectRevert(OierAccount.Frozen.selector);
        acct.configure(abi.encodeCall(IOierRules.setGuard, (kAllow, 0, 0, false)));
        // Loosening R1 itself now needs 7 days and the co-signer.
        vm.prank(owner);
        uint256 c3 = acct.configure(abi.encodeCall(IOierRules.setAllowed, (address(0x9004), true)));
        _skip(7 days);
        vm.expectRevert(OierAccount.NeedsApprovals.selector);
        acct.applyChange(c3);
        vm.prank(cosigner);
        acct.approveChange(c3);
        acct.applyChange(c3);
        assertTrue(acct.allowed(address(0x9004)), "applied with approval");
    }

    function test_unknownChangeRejected() public {
        vm.prank(owner);
        vm.expectRevert(OierAccount.UnknownChange.selector);
        acct.configure(abi.encodeWithSignature("transferOwnership(address)", attacker));
    }

    function test_recoveryWithTimelock() public {
        address fresh = address(0x7777);
        vm.prank(g1);
        acct.startRecovery(fresh);
        vm.expectRevert(OierAccount.NeedsApprovals.selector);
        acct.finalizeRecovery();
        vm.prank(g2);
        acct.supportRecovery();
        vm.expectRevert(OierAccount.NotReady.selector);
        acct.finalizeRecovery();
        // Unanimous: the (possibly stolen) owner key cannot veto.
        vm.prank(owner);
        vm.expectRevert(OierAccount.BadState.selector);
        acct.cancelRecovery();
        _skip(3 days);
        acct.finalizeRecovery();
        assertTrue(acct.owner() == fresh, "rotated");
    }

    function test_ownerVetoWhenNotUnanimous() public {
        vm.prank(g1);
        acct.startRecovery(address(0x7777));
        vm.prank(owner);
        acct.cancelRecovery();
        assertTrue(acct.recoveryCandidate() == address(0), "vetoed");
    }

    function test_onlyOwnerProposes() public {
        vm.prank(attacker);
        vm.expectRevert(OierAccount.NotOwner.selector);
        acct.propose(address(usdg), priya, 1e6);
        vm.prank(attacker);
        vm.expectRevert(OierAccount.NotOwner.selector);
        acct.configure(abi.encodeCall(IOierRules.setAllowlistOn, (false)));
    }

    function test_nativeTransfer() public {
        vm.prank(owner);
        acct.configure(abi.encodeCall(IOierRules.setLimits, (address(0), 1 ether, 2 ether, 0, 0)));
        vm.prank(owner);
        uint256 id = acct.propose(address(0), priya, 0.5 ether);
        _skip(6 hours);
        acct.execute(id);
        assertEq(priya.balance, 0.5 ether, "eth paid");
    }

    /// Fuzz: no sequence of proposals within one day exceeds the day cap.
    function testFuzz_dayCapHolds(uint96[8] memory amounts, uint16[8] memory gaps) public {
        uint256 windowStart = T;
        uint256 total;
        vm.startPrank(owner);
        for (uint256 i = 0; i < 8; i++) {
            uint256 amt = uint256(amounts[i]) % (TX_CAP + 1);
            if (amt == 0) continue;
            _skip((uint256(gaps[i]) % 3 hours));
            if (T >= windowStart + 23 hours) break;
            (uint8 code,,) = acct.check(address(usdg), priya, amt);
            if (code == 0) {
                acct.propose(address(usdg), priya, amt);
                total += amt;
            }
        }
        vm.stopPrank();
        assertTrue(total <= DAY_CAP, "day cap");
    }

    /// Fuzz: the owner key alone never pays a non-allowlisted address.
    function testFuzz_stolenKeyCannotPayStranger(address stranger, uint96 amount, uint32 wait) public {
        vm.assume(stranger != priya && stranger != halden && stranger != address(0));
        vm.prank(owner);
        try acct.propose(address(usdg), stranger, uint256(amount) % TX_CAP + 1) {
            revert("should have been denied");
        } catch {}
        vm.prank(owner);
        uint256 cid = acct.configure(abi.encodeCall(IOierRules.setAllowed, (stranger, true)));
        _skip((uint256(wait) % DEFAULT_DELAY));
        try acct.applyChange(cid) {
            revert("applied too early");
        } catch {}
        assertTrue(!acct.allowed(stranger), "still not allowed");
    }
}

/// Drives the account as a (possibly stolen) owner key for invariant testing.
contract Handler is Base {
    uint256[] public proposedAmount;
    uint32[] public proposedHour;
    bool[] public cancelled;
    uint256 public loosenProposedAt;
    uint256 public loosenAppliedAt;
    uint256 public loosenId = type(uint256).max;

    constructor() {
        _setUpAccount();
    }

    function account() external view returns (OierAccount) {
        return acct;
    }

    function token() external view returns (MockToken) {
        return usdg;
    }

    function attackerAddr() external view returns (address) {
        return attacker;
    }

    function propose(uint256 amount, bool toAttacker) external {
        amount = amount % (TX_CAP + 1);
        vm.prank(owner);
        try acct.propose(address(usdg), toAttacker ? attacker : priya, amount) returns (uint256 id) {
            proposedAmount.push(amount);
            proposedHour.push(uint32(T / 1 hours));
            cancelled.push(false);
            id;
        } catch {}
    }

    function execute(uint256 id) external {
        uint256 n = acct.transferCount();
        if (n == 0) return;
        try acct.execute(id % n) {} catch {}
    }

    function cancel(uint256 id) external {
        uint256 n = acct.transferCount();
        if (n == 0) return;
        vm.prank(owner);
        try acct.cancelTransfer(id % n) {
            cancelled[id % n] = true;
        } catch {}
    }

    function wait(uint32 secs) external {
        _skip((secs % 30 hours));
    }

    function tryLoosen() external {
        if (loosenId != type(uint256).max) return;
        vm.prank(owner);
        loosenId = acct.configure(abi.encodeCall(IOierRules.setAllowed, (attacker, true)));
        loosenProposedAt = T;
    }

    function tryApply() external {
        if (loosenId == type(uint256).max || loosenAppliedAt != 0) return;
        try acct.applyChange(loosenId) {
            loosenAppliedAt = T;
        } catch {}
    }

    function count() external view returns (uint256) {
        return proposedAmount.length;
    }
}

contract OierInvariants {
    Handler internal handler;

    function setUp() public {
        handler = new Handler();
    }

    function targetContracts() public view returns (address[] memory t) {
        t = new address[](1);
        t[0] = address(handler);
    }

    /// The attacker only ever receives funds after a loosening change waited its full delay.
    function invariant_attackerOnlyAfterDelay() public view {
        uint256 got = handler.token().balanceOf(handler.attackerAddr());
        if (got == 0) return;
        require(handler.loosenAppliedAt() != 0, "paid without a change");
        require(handler.loosenAppliedAt() >= handler.loosenProposedAt() + 2 days, "change applied early");
    }

    /// Live (not cancelled) proposals in any 24 hourly buckets never exceed the day cap.
    function invariant_dayCapPerWindow() public view {
        uint256 n = handler.count();
        for (uint256 i = 0; i < n; i++) {
            uint256 h = handler.proposedHour(i);
            uint256 sum;
            for (uint256 j = 0; j < n; j++) {
                uint256 hj = handler.proposedHour(j);
                if (!handler.cancelled(j) && hj <= h && hj + 24 > h) sum += handler.proposedAmount(j);
            }
            require(sum <= 1_200e6, "day cap exceeded in a window");
        }
    }
}
