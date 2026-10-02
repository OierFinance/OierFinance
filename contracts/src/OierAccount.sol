// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Rule-change calls understood by OierAccount.configure. These are
///         encodings only: the account never exposes them as entry points.
interface IOierRules {
    function setAllowlistOn(bool on) external;
    function setAllowed(address to, bool ok) external;
    function setBlocked(address to, bool b) external;
    function setLimits(address asset, uint256 txCap, uint256 dayCap, uint256 weekCap, uint256 cosignAbove) external;
    function setCosigners(address[] calldata list, uint8 required) external;
    function setTiming(uint32 settleDelay, uint32 payeeCooldown) external;
    function setQuietHours(bool on, uint8 from, uint8 to, int32 offset) external;
    function setRecovery(address[] calldata guardians, uint8 threshold, uint32 delay) external;
    function setLockUntil(uint64 until) external;
    function setGuard(bytes32 target, uint32 delay, uint8 approvals, bool frozen) external;
}

/// @title OierAccount
/// @notice A self-custodied account whose owner can only *propose* transfers.
///         Every transfer is checked against rules stored in this contract:
///         payee allowlist and blocklist, per-transfer and rolling caps per
///         asset, a co-signer requirement above a threshold, a settlement
///         delay with recall, a cooldown for new payees, quiet hours and a
///         lock date. Rules can be tightened at once; loosening a rule goes
///         through that rule's guard (a delay, co-signer approvals, or never
///         if frozen). Guards are themselves rules with guards, so they chain.
///         Guardians can rotate the owner after a timelock.
/// @dev    UNAUDITED. No admin, no upgrade path, no function that lets anyone
///         but the rules move funds. Asset address(0) means the native coin.
contract OierAccount {
    // ------------------------------------------------------------------
    // Types
    // ------------------------------------------------------------------

    struct Guard {
        uint32 delay; // seconds a loosening change waits
        uint8 approvals; // co-signer approvals a loosening change needs
        bool frozen; // loosening is never allowed
        bool set; // false = fall back to the default guard
    }

    struct Limits {
        uint256 txCap; // 0 = no per-transfer cap
        uint256 dayCap; // 0 = no 24h cap (hourly buckets)
        uint256 weekCap; // 0 = no 7-day cap (daily buckets)
        uint256 cosignAbove; // 0 = no co-signer needed; else amounts above need approvals
    }

    struct Transfer {
        address asset;
        address to;
        uint256 amount;
        uint64 proposedAt;
        uint64 executeAfter;
        uint32 hourIdx;
        uint32 dayIdx;
        uint8 approvals;
        bool needsCosign;
        uint8 status; // 0 pending, 1 executed, 2 cancelled
    }

    struct Change {
        bytes32 key;
        bytes data;
        uint64 proposedAt;
        uint64 readyAt;
        uint8 approvalsNeeded;
        uint8 approvals;
        uint8 status; // 0 pending, 1 applied, 2 cancelled
    }

    // Result codes of check().
    uint8 public constant OK = 0;
    uint8 public constant DENY_BLOCKED = 1;
    uint8 public constant DENY_NOT_ALLOWED = 2;
    uint8 public constant DENY_TX_CAP = 3;
    uint8 public constant DENY_DAY_CAP = 4;
    uint8 public constant DENY_WEEK_CAP = 5;
    uint8 public constant DENY_ZERO = 6;

    uint256 public constant MAX_SET = 10;
    uint32 public constant MIN_DEFAULT_DELAY = 1 hours;
    uint32 public constant SETUP_WINDOW = 1 days;
    uint32 public constant MAX_INSTANT_LOCK = 30 days;
    uint32 public constant MAX_GUARD_DELAY = 30 days;
    uint32 public constant DEFAULT_GUARD_DELAY = 2 days;

    bytes32 public constant K_DEFAULT = keccak256("oier.default");
    bytes32 public constant K_ALLOW = keccak256("oier.allow");
    bytes32 public constant K_BLOCK = keccak256("oier.block");
    bytes32 public constant K_COSIGNERS = keccak256("oier.cosigners");
    bytes32 public constant K_TIMING = keccak256("oier.timing");
    bytes32 public constant K_QUIET = keccak256("oier.quiet");
    bytes32 public constant K_RECOVERY = keccak256("oier.recovery");
    bytes32 public constant K_LOCK = keccak256("oier.lock");

    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant APPROVE_TRANSFER_TYPEHASH =
        keccak256("ApproveTransfer(uint256 id,address asset,address to,uint256 amount)");

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------

    address public owner;
    address public immutable deployer;
    bool public initialized;
    uint64 public setupEndsAt; // rules change instantly until then (or finishSetup)

    bool public allowlistOn;
    mapping(address => bool) public allowed;
    mapping(address => bool) public blocked;
    mapping(address => uint64) public payeeSince;

    mapping(address => Limits) internal _limits;
    mapping(address => mapping(uint256 => uint256)) public hourSpent;
    mapping(address => mapping(uint256 => uint256)) public daySpent;

    uint32 public settleDelay;
    uint32 public payeeCooldown;
    bool public quietOn;
    uint8 public quietFrom;
    uint8 public quietTo;
    int32 public tzOffset; // seconds east of UTC used for quiet hours
    uint64 public lockUntil;

    address[] internal _cosigners;
    mapping(address => bool) public isCosigner;
    uint8 public cosignRequired;

    address[] internal _guardians;
    mapping(address => bool) public isGuardian;
    uint8 public recoveryThreshold;
    uint32 public recoveryDelay;

    mapping(bytes32 => Guard) internal _guards;

    Transfer[] internal _transfers;
    mapping(uint256 => mapping(address => bool)) public transferApprovedBy;
    Change[] internal _changes;
    mapping(uint256 => mapping(address => bool)) public changeApprovedBy;

    address public recoveryCandidate;
    uint64 public recoveryStartedAt;
    uint32 public recoveryRound;
    uint8 public recoverySupport;
    mapping(uint32 => mapping(address => bool)) public recoverySupportedBy;

    uint256 private _entered = 1;
    bytes32 private immutable _domainSeparator;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------

    event Received(address indexed from, uint256 amount);
    event TransferProposed(uint256 indexed id, address indexed asset, address indexed to, uint256 amount, uint64 executeAfter, bool needsCosign);
    event TransferApproved(uint256 indexed id, address indexed cosigner);
    event TransferExecuted(uint256 indexed id);
    event TransferCancelled(uint256 indexed id, address indexed by);
    event ChangeProposed(uint256 indexed id, bytes32 indexed key, bytes data, uint64 readyAt, uint8 approvalsNeeded);
    event ChangeApproved(uint256 indexed id, address indexed cosigner);
    event ChangeApplied(uint256 indexed id, bytes32 indexed key, bytes data);
    event ChangeCancelled(uint256 indexed id, address indexed by);
    event SetupFinished();
    event RecoveryStarted(uint32 indexed round, address indexed candidate, address indexed by);
    event RecoverySupported(uint32 indexed round, address indexed guardian);
    event RecoveryCancelled(uint32 indexed round, address indexed by);
    event OwnerChanged(address indexed previous, address indexed next);

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------

    error NotOwner();
    error NotCosigner();
    error NotGuardian();
    error Denied(uint8 code);
    error BadState();
    error NotReady();
    error QuietHours();
    error Locked();
    error NeedsApprovals();
    error Frozen();
    error UnknownChange();
    error BadParams();
    error CallFailed();
    error Reentrant();
    error BadSignature();

    // ------------------------------------------------------------------
    // Construction
    // ------------------------------------------------------------------

    constructor(address owner_) {
        if (owner_ == address(0)) revert BadParams();
        owner = owner_;
        deployer = msg.sender;
        setupEndsAt = uint64(block.timestamp + SETUP_WINDOW);
        _guards[K_DEFAULT] = Guard({delay: DEFAULT_GUARD_DELAY, approvals: 0, frozen: false, set: true});
        _domainSeparator = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256("OierAccount"), keccak256("1"), block.chainid, address(this))
        );
    }

    /// @notice First rules, applied once by the creating factory in the same
    ///         transaction as the deployment. Keeps the address independent of them.
    function initialize(bytes[] calldata config, bool finish) external {
        if (msg.sender != deployer || initialized) revert BadState();
        initialized = true;
        for (uint256 i = 0; i < config.length; i++) {
            (bytes32 key,) = classify(config[i]);
            _dispatch(config[i]);
            emit ChangeApplied(type(uint256).max, key, config[i]);
        }
        if (finish) {
            setupEndsAt = uint64(block.timestamp);
            emit SetupFinished();
        }
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // ------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_entered != 1) revert Reentrant();
        _entered = 2;
        _;
        _entered = 1;
    }

    // ------------------------------------------------------------------
    // Transfers
    // ------------------------------------------------------------------

    /// @notice What would happen to a proposed transfer right now.
    /// @return code OK or a DENY_* code
    /// @return executeAfter earliest execution time if OK
    /// @return needsCosign whether co-signer approvals are required
    function check(address asset, address to, uint256 amount)
        public
        view
        returns (uint8 code, uint64 executeAfter, bool needsCosign)
    {
        if (amount == 0) return (DENY_ZERO, 0, false);
        if (blocked[to]) return (DENY_BLOCKED, 0, false);
        if (allowlistOn && !allowed[to]) return (DENY_NOT_ALLOWED, 0, false);
        Limits storage l = _limits[asset];
        if (l.txCap != 0 && amount > l.txCap) return (DENY_TX_CAP, 0, false);
        if (l.dayCap != 0 && spentLastDay(asset) + amount > l.dayCap) return (DENY_DAY_CAP, 0, false);
        if (l.weekCap != 0 && spentLastWeek(asset) + amount > l.weekCap) return (DENY_WEEK_CAP, 0, false);
        needsCosign = l.cosignAbove != 0 && amount > l.cosignAbove;
        executeAfter = _earliest(to);
        return (OK, executeAfter, needsCosign);
    }

    /// @notice Propose a transfer. Counts against caps immediately; executes later.
    function propose(address asset, address to, uint256 amount) external onlyOwner returns (uint256 id) {
        (uint8 code, uint64 executeAfter, bool needsCosign) = check(asset, to, amount);
        if (code != OK) revert Denied(code);
        if (payeeSince[to] == 0) payeeSince[to] = uint64(block.timestamp);
        uint32 h = uint32(block.timestamp / 1 hours);
        uint32 d = uint32(block.timestamp / 1 days);
        hourSpent[asset][h] += amount;
        daySpent[asset][d] += amount;
        id = _transfers.length;
        _transfers.push(
            Transfer({
                asset: asset,
                to: to,
                amount: amount,
                proposedAt: uint64(block.timestamp),
                executeAfter: executeAfter,
                hourIdx: h,
                dayIdx: d,
                approvals: 0,
                needsCosign: needsCosign,
                status: 0
            })
        );
        emit TransferProposed(id, asset, to, amount, executeAfter, needsCosign);
    }

    function approveTransfer(uint256 id) external {
        _approveTransfer(id, msg.sender);
    }

    /// @notice Submit a co-signer's EIP-712 approval on their behalf.
    function approveTransferWithSig(uint256 id, address cosigner, bytes calldata sig) external {
        Transfer storage t = _transfer(id);
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _domainSeparator,
                keccak256(abi.encode(APPROVE_TRANSFER_TYPEHASH, id, t.asset, t.to, t.amount))
            )
        );
        if (_recover(digest, sig) != cosigner) revert BadSignature();
        _approveTransfer(id, cosigner);
    }

    function _approveTransfer(uint256 id, address who) internal {
        if (!isCosigner[who]) revert NotCosigner();
        Transfer storage t = _transfer(id);
        if (t.status != 0) revert BadState();
        if (transferApprovedBy[id][who]) return;
        transferApprovedBy[id][who] = true;
        t.approvals += 1;
        emit TransferApproved(id, who);
    }

    /// @notice Anyone may execute a transfer once it is due and approved.
    function execute(uint256 id) external nonReentrant {
        Transfer storage t = _transfer(id);
        if (t.status != 0) revert BadState();
        if (block.timestamp < t.executeAfter) revert NotReady();
        if (block.timestamp < lockUntil) revert Locked();
        if (_inQuietHours(block.timestamp)) revert QuietHours();
        if (t.needsCosign && (cosignRequired == 0 || t.approvals < cosignRequired)) revert NeedsApprovals();
        // Rules tightened after the proposal still apply.
        if (blocked[t.to]) revert Denied(DENY_BLOCKED);
        if (allowlistOn && !allowed[t.to]) revert Denied(DENY_NOT_ALLOWED);
        t.status = 1;
        if (t.asset == address(0)) {
            (bool ok,) = t.to.call{value: t.amount}("");
            if (!ok) revert CallFailed();
        } else {
            (bool ok, bytes memory ret) = t.asset.call(abi.encodeWithSelector(0xa9059cbb, t.to, t.amount));
            if (!ok || (ret.length != 0 && !abi.decode(ret, (bool))) || t.asset.code.length == 0) revert CallFailed();
        }
        emit TransferExecuted(id);
    }

    /// @notice Recall a pending transfer. Owner, any co-signer or any guardian.
    function cancelTransfer(uint256 id) external {
        if (msg.sender != owner && !isCosigner[msg.sender] && !isGuardian[msg.sender]) revert NotOwner();
        Transfer storage t = _transfer(id);
        if (t.status != 0) revert BadState();
        t.status = 2;
        // Give the reserved amount back to the buckets it was counted in.
        hourSpent[t.asset][t.hourIdx] -= t.amount;
        daySpent[t.asset][t.dayIdx] -= t.amount;
        emit TransferCancelled(id, msg.sender);
    }

    // ------------------------------------------------------------------
    // Rule changes
    // ------------------------------------------------------------------

    /// @notice Change a rule. Tightening applies now; loosening waits for the rule's guard.
    /// @param data ABI-encoded call to one of the set* functions below.
    /// @return id change id, or type(uint256).max when applied immediately
    function configure(bytes memory data) external onlyOwner returns (uint256 id) {
        return _configure(data);
    }

    /// @notice Apply several changes in one transaction (same rules as configure).
    function configureMany(bytes[] memory data) external onlyOwner {
        for (uint256 i = 0; i < data.length; i++) _configure(data[i]);
    }

    function finishSetup() external onlyOwner {
        if (block.timestamp >= setupEndsAt) return;
        setupEndsAt = uint64(block.timestamp);
        emit SetupFinished();
    }

    function inSetup() public view returns (bool) {
        return block.timestamp < setupEndsAt;
    }

    function _configure(bytes memory data) internal returns (uint256 id) {
        (bytes32 key, bool loosens) = classify(data);
        if (!loosens || inSetup()) {
            _dispatch(data);
            emit ChangeApplied(type(uint256).max, key, data);
            return type(uint256).max;
        }
        Guard memory g = guardOf(key);
        if (g.frozen) revert Frozen();
        if (g.delay == 0 && g.approvals == 0) {
            _dispatch(data);
            emit ChangeApplied(type(uint256).max, key, data);
            return type(uint256).max;
        }
        id = _changes.length;
        uint64 readyAt = uint64(block.timestamp + g.delay);
        _changes.push(
            Change({
                key: key,
                data: data,
                proposedAt: uint64(block.timestamp),
                readyAt: readyAt,
                approvalsNeeded: g.approvals,
                approvals: 0,
                status: 0
            })
        );
        emit ChangeProposed(id, key, data, readyAt, g.approvals);
    }

    function approveChange(uint256 id) external {
        if (!isCosigner[msg.sender]) revert NotCosigner();
        Change storage c = _change(id);
        if (c.status != 0) revert BadState();
        if (changeApprovedBy[id][msg.sender]) return;
        changeApprovedBy[id][msg.sender] = true;
        c.approvals += 1;
        emit ChangeApproved(id, msg.sender);
    }

    /// @notice Anyone may apply a queued change once its guard is satisfied.
    function applyChange(uint256 id) external {
        Change storage c = _change(id);
        if (c.status != 0) revert BadState();
        if (block.timestamp < c.readyAt) revert NotReady();
        if (c.approvals < c.approvalsNeeded) revert NeedsApprovals();
        // A guard frozen after the change was queued still wins.
        if (guardOf(c.key).frozen) revert Frozen();
        c.status = 1;
        _dispatch(c.data);
        emit ChangeApplied(id, c.key, c.data);
    }

    /// @notice Cancel a queued change. Owner, any co-signer or any guardian.
    function cancelChange(uint256 id) external {
        if (msg.sender != owner && !isCosigner[msg.sender] && !isGuardian[msg.sender]) revert NotOwner();
        Change storage c = _change(id);
        if (c.status != 0) revert BadState();
        c.status = 2;
        emit ChangeCancelled(id, msg.sender);
    }

    /// @notice Which rule a change touches and whether it loosens it.
    function classify(bytes memory data) public view returns (bytes32 key, bool loosens) {
        (bytes4 sel, bytes memory args) = _split(data);
        if (sel == IOierRules.setAllowlistOn.selector) {
            bool on = abi.decode(args, (bool));
            return (K_ALLOW, allowlistOn && !on);
        }
        if (sel == IOierRules.setAllowed.selector) {
            (, bool ok) = abi.decode(args, (address, bool));
            return (K_ALLOW, ok);
        }
        if (sel == IOierRules.setBlocked.selector) {
            (, bool b) = abi.decode(args, (address, bool));
            return (K_BLOCK, !b);
        }
        if (sel == IOierRules.setLimits.selector) {
            (address asset, uint256 txCap, uint256 dayCap, uint256 weekCap, uint256 cosignAbove) =
                abi.decode(args, (address, uint256, uint256, uint256, uint256));
            Limits storage l = _limits[asset];
            bool looser = _capLooser(l.txCap, txCap) || _capLooser(l.dayCap, dayCap) || _capLooser(l.weekCap, weekCap)
                || _capLooser(l.cosignAbove, cosignAbove);
            return (limitsKey(asset), looser);
        }
        if (sel == IOierRules.setCosigners.selector) {
            return (K_COSIGNERS, true);
        }
        if (sel == IOierRules.setTiming.selector) {
            (uint32 delay_, uint32 cooldown_) = abi.decode(args, (uint32, uint32));
            return (K_TIMING, delay_ < settleDelay || cooldown_ < payeeCooldown);
        }
        if (sel == IOierRules.setQuietHours.selector) {
            (bool on,,,) = abi.decode(args, (bool, uint8, uint8, int32));
            return (K_QUIET, quietOn || !on);
        }
        if (sel == IOierRules.setRecovery.selector) {
            return (K_RECOVERY, true);
        }
        if (sel == IOierRules.setLockUntil.selector) {
            uint64 until = abi.decode(args, (uint64));
            // Short locks apply at once; long ones wait for the guard so a
            // stolen key cannot freeze the funds for months.
            return (K_LOCK, until < lockUntil || until > block.timestamp + MAX_INSTANT_LOCK);
        }
        if (sel == IOierRules.setGuard.selector) {
            (bytes32 target, uint32 delay_, uint8 approvals_, bool frozen_) =
                abi.decode(args, (bytes32, uint32, uint8, bool));
            Guard memory cur = guardOf(target);
            bool looser = (cur.frozen && !frozen_) || delay_ < cur.delay || approvals_ < cur.approvals;
            // Freezing a rule or demanding more approvals could brick the
            // account if a stolen key did it, so those also wait for the guard.
            bool irreversible = (frozen_ && !cur.frozen) || approvals_ > cur.approvals;
            return (guardKey(target), looser || irreversible);
        }
        revert UnknownChange();
    }

    function _capLooser(uint256 current, uint256 next) internal pure returns (bool) {
        if (current == 0) return false; // no cap yet: any value is tighter or equal
        return next == 0 || next > current;
    }

    function _split(bytes memory data) internal pure returns (bytes4 sel, bytes memory args) {
        if (data.length < 4) revert UnknownChange();
        assembly {
            sel := mload(add(data, 32))
        }
        args = new bytes(data.length - 4);
        for (uint256 i = 0; i < args.length; i++) args[i] = data[i + 4];
    }

    /// @dev Applies a rule change already classified and cleared by its guard.
    function _dispatch(bytes memory data) internal {
        (bytes4 sel, bytes memory a) = _split(data);
        if (sel == IOierRules.setAllowlistOn.selector) {
            allowlistOn = abi.decode(a, (bool));
        } else if (sel == IOierRules.setAllowed.selector) {
            (address to, bool ok) = abi.decode(a, (address, bool));
            allowed[to] = ok;
            if (ok && payeeSince[to] == 0) payeeSince[to] = uint64(block.timestamp);
        } else if (sel == IOierRules.setBlocked.selector) {
            (address to, bool b) = abi.decode(a, (address, bool));
            blocked[to] = b;
        } else if (sel == IOierRules.setLimits.selector) {
            (address asset, uint256 txCap, uint256 dayCap, uint256 weekCap, uint256 cosignAbove) =
                abi.decode(a, (address, uint256, uint256, uint256, uint256));
            _limits[asset] = Limits(txCap, dayCap, weekCap, cosignAbove);
        } else if (sel == IOierRules.setCosigners.selector) {
            (address[] memory list, uint8 required) = abi.decode(a, (address[], uint8));
            _setCosigners(list, required);
        } else if (sel == IOierRules.setTiming.selector) {
            (uint32 delay_, uint32 cooldown_) = abi.decode(a, (uint32, uint32));
            if (delay_ > 30 days || cooldown_ > 30 days) revert BadParams();
            settleDelay = delay_;
            payeeCooldown = cooldown_;
        } else if (sel == IOierRules.setQuietHours.selector) {
            (bool on, uint8 from, uint8 to, int32 offset) = abi.decode(a, (bool, uint8, uint8, int32));
            if (from > 23 || to > 23 || (on && from == to) || offset < -14 hours || offset > 14 hours) revert BadParams();
            quietOn = on;
            quietFrom = from;
            quietTo = to;
            tzOffset = offset;
        } else if (sel == IOierRules.setRecovery.selector) {
            (address[] memory list, uint8 threshold, uint32 delay_) = abi.decode(a, (address[], uint8, uint32));
            _setRecovery(list, threshold, delay_);
        } else if (sel == IOierRules.setLockUntil.selector) {
            uint64 until = abi.decode(a, (uint64));
            if (until > block.timestamp + 400 days) revert BadParams();
            lockUntil = until;
        } else if (sel == IOierRules.setGuard.selector) {
            (bytes32 target, uint32 delay_, uint8 approvals_, bool frozen_) = abi.decode(a, (bytes32, uint32, uint8, bool));
            if (delay_ > MAX_GUARD_DELAY || approvals_ > MAX_SET) revert BadParams();
            if (target == K_DEFAULT && delay_ < MIN_DEFAULT_DELAY) revert BadParams();
            _guards[target] = Guard(delay_, approvals_, frozen_, true);
        } else {
            revert UnknownChange();
        }
    }

    function _setCosigners(address[] memory list, uint8 required) internal {
        if (list.length > MAX_SET || required > list.length) revert BadParams();
        for (uint256 i = 0; i < _cosigners.length; i++) isCosigner[_cosigners[i]] = false;
        delete _cosigners;
        for (uint256 i = 0; i < list.length; i++) {
            address c = list[i];
            if (c == address(0) || isCosigner[c]) revert BadParams();
            isCosigner[c] = true;
            _cosigners.push(c);
        }
        cosignRequired = required;
    }

    function _setRecovery(address[] memory list, uint8 threshold, uint32 delay_) internal {
        if (list.length > MAX_SET || threshold > list.length || (list.length > 0 && threshold == 0)) revert BadParams();
        if (delay_ < 1 days || delay_ > 90 days) revert BadParams();
        for (uint256 i = 0; i < _guardians.length; i++) isGuardian[_guardians[i]] = false;
        delete _guardians;
        for (uint256 i = 0; i < list.length; i++) {
            address g = list[i];
            if (g == address(0) || isGuardian[g]) revert BadParams();
            isGuardian[g] = true;
            _guardians.push(g);
        }
        recoveryThreshold = threshold;
        recoveryDelay = delay_;
        _endRecovery();
    }

    // ------------------------------------------------------------------
    // Recovery
    // ------------------------------------------------------------------

    function startRecovery(address candidate) external {
        if (!isGuardian[msg.sender]) revert NotGuardian();
        if (candidate == address(0) || recoveryThreshold == 0) revert BadParams();
        recoveryRound += 1;
        recoveryCandidate = candidate;
        recoveryStartedAt = uint64(block.timestamp);
        recoverySupport = 1;
        recoverySupportedBy[recoveryRound][msg.sender] = true;
        emit RecoveryStarted(recoveryRound, candidate, msg.sender);
        emit RecoverySupported(recoveryRound, msg.sender);
    }

    function supportRecovery() external {
        if (!isGuardian[msg.sender]) revert NotGuardian();
        if (recoveryCandidate == address(0)) revert BadState();
        if (recoverySupportedBy[recoveryRound][msg.sender]) return;
        recoverySupportedBy[recoveryRound][msg.sender] = true;
        recoverySupport += 1;
        emit RecoverySupported(recoveryRound, msg.sender);
    }

    /// @notice The owner may veto a recovery, unless every guardian supports it.
    function cancelRecovery() external {
        if (recoveryCandidate == address(0)) revert BadState();
        bool unanimous = recoverySupport >= _guardians.length;
        if (msg.sender == owner) {
            if (unanimous) revert BadState();
        } else if (!isGuardian[msg.sender]) {
            revert NotGuardian();
        }
        emit RecoveryCancelled(recoveryRound, msg.sender);
        _endRecovery();
    }

    function finalizeRecovery() external {
        if (recoveryCandidate == address(0)) revert BadState();
        if (recoverySupport < recoveryThreshold) revert NeedsApprovals();
        if (block.timestamp < recoveryStartedAt + recoveryDelay) revert NotReady();
        address previous = owner;
        owner = recoveryCandidate;
        _endRecovery();
        emit OwnerChanged(previous, owner);
    }

    function _endRecovery() internal {
        recoveryCandidate = address(0);
        recoveryStartedAt = 0;
        recoverySupport = 0;
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    function limitsKey(address asset) public pure returns (bytes32) {
        return keccak256(abi.encode("oier.limits", asset));
    }

    function guardKey(bytes32 target) public pure returns (bytes32) {
        return keccak256(abi.encode("oier.guard", target));
    }

    function guardOf(bytes32 key) public view returns (Guard memory) {
        Guard memory g = _guards[key];
        return g.set ? g : _guards[K_DEFAULT];
    }

    function limits(address asset) external view returns (Limits memory) {
        return _limits[asset];
    }

    function cosigners() external view returns (address[] memory) {
        return _cosigners;
    }

    function guardians() external view returns (address[] memory) {
        return _guardians;
    }

    function transferCount() external view returns (uint256) {
        return _transfers.length;
    }

    function transferAt(uint256 id) external view returns (Transfer memory) {
        return _transfers[id];
    }

    function changeCount() external view returns (uint256) {
        return _changes.length;
    }

    function changeAt(uint256 id) external view returns (Change memory) {
        return _changes[id];
    }

    function spentLastDay(address asset) public view returns (uint256 sum) {
        uint256 h = block.timestamp / 1 hours;
        for (uint256 i = 0; i < 24 && i <= h; i++) sum += hourSpent[asset][h - i];
    }

    function spentLastWeek(address asset) public view returns (uint256 sum) {
        uint256 d = block.timestamp / 1 days;
        for (uint256 i = 0; i < 7 && i <= d; i++) sum += daySpent[asset][d - i];
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparator;
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    function _earliest(address to) internal view returns (uint64 t) {
        uint256 at = block.timestamp + settleDelay;
        uint256 since = payeeSince[to] == 0 ? block.timestamp : payeeSince[to];
        if (since + payeeCooldown > at) at = since + payeeCooldown;
        if (lockUntil > at) at = lockUntil;
        // Push past quiet hours (at most 23 hourly steps).
        for (uint256 i = 0; i < 24 && _inQuietHours(at); i++) at = (at / 1 hours + 1) * 1 hours;
        return uint64(at);
    }

    function _inQuietHours(uint256 ts) internal view returns (bool) {
        if (!quietOn) return false;
        int256 local = int256(ts) + int256(tzOffset);
        if (local < 0) local = 0;
        uint256 hour = (uint256(local) / 1 hours) % 24;
        return quietFrom < quietTo ? (hour >= quietFrom && hour < quietTo) : (hour >= quietFrom || hour < quietTo);
    }

    function _transfer(uint256 id) internal view returns (Transfer storage) {
        if (id >= _transfers.length) revert BadState();
        return _transfers[id];
    }

    function _change(uint256 id) internal view returns (Change storage) {
        if (id >= _changes.length) revert BadState();
        return _changes[id];
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        if (sig.length != 65) revert BadSignature();
        bytes32 r = bytes32(sig[0:32]);
        bytes32 s = bytes32(sig[32:64]);
        uint8 v = uint8(sig[64]);
        if (v < 27) v += 27;
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) revert BadSignature();
        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert BadSignature();
        return signer;
    }
}
