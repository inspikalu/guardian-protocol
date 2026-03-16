# Guardian Protocol

Guardian Protocol is a suite of Solana programs implementing classic distributed system resilience and security patterns on-chain. It focuses on three core pillars: **Role-Based Access Control (RBAC)**, **Circuit Breakers**, and **Distributed Lock Management**.

## Architecture Overview

Guardian Protocol allows developers to wrap sensitive operations (like treasury transfers or oracle updates) in a multilayered protection sequence orchestrated by the `orchestrator` program.

### Core Programs
1.  **RBAC (Role-Based Access Control)**: Manages hierarchical roles and permissions. Replaces simple "admin only" checks with granular, auditable permissions.
2.  **Circuit Breaker**: Protects downstream programs from cascading failures. Monitors execution health and automatically blocks calls if failure rates exceed thresholds.
3.  **Lock Manager**: Provides distributed exclusion for shared resources (like shared PDAs) to prevent race conditions and ensure consistency across CPI calls.
4.  **Orchestrator**: The entry point that chains these patterns together into a single atomic transaction.

---

## Web2 to Solana Analysis

Guardian Protocol translates battle-tested backend patterns from the Web2 world into the high-concurrency, stateful environment of Solana.

| Pattern | Web2 Equivalent | Solana Implementation | Value Add |
| :--- | :--- | :--- | :--- |
| **Access Control** | AWS IAM / Keycloak | **RBAC PDA Hierarchy** | Moves identity management on-chain for trustless permissioning. |
| **Resilience** | Netflix Hystrix / Resilience4j | **Circuit Breaker State Machine** | Prevents program exploitation or data corruption during external failure. |
| **Concurrency** | Redis Lock / Zookeeper | **Lock Manager & Receipt PDAs** | Ensures atomic resource access across multiple protocol interactions. |

---

## Devnet Deployment

The protocol is fully deployed and verified on Solana Devnet.

- **Orchestrator**: `X61sTdLaXMaAjdDE9UFSs36FoabSQMiXGS2uABzeJjB`
- **RBAC**: `EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS`
- **Circuit Breaker**: `9GXUR2xcVDxnu1JNEdDqCrLRL9K44t5iYxcTWekMaPma`
- **Lock Manager**: `reMMumQqHvHcQWJnyURAASgsp3zomq6cLdW3dUyyZ7j`

*(Actual IDs are configured in `Anchor.toml`)*

---

## Testing & Verification

### Automated Tests
Run the following to verify the programs on Devnet:
```bash
anchor test --provider.cluster devnet
```

### Integrated Client (Dashboard)
The project includes a Next.js dashboard that interacts with the live programs:
1.  Navigate to `guardian-ui`.
2.  Run `npm install && npm run dev`.
3.  Visit the **System Lab** to execute a real **Protected Operation** on Devnet.

---

## Tradeoffs & Constraints (Web2 vs. Solana)

Building these backend patterns on Solana introduces unique architectural considerations compared to traditional Web2 environments:

### 1. Compute Limits & Latency
- **Tradeoff:** Wrapping operations in multiple security programs (RBAC + Circuit + Lock) adds compute unit (CU) costs and network latency. 
- **Constraint:** Solana transactions have a strict 1.4M CU limit.
- **Solution:** We optimized cross-program invocations (CPIs) and use a hierarchical RBAC model to minimize the number of accounts loaded per transaction, providing "Defense in Depth" while staying within compute budgets.

### 2. Public State Visibility
- **Tradeoff:** Unlike centralized databases (e.g., AWS RDS), all on-chain state—including roles, locks, and circuit statuses—is globally visible.
- **Constraint:** We cannot store sensitive PII or private metadata directly in the RBAC roles.
- **Solution:** The protocol stores deterministic cryptographic identifiers (like public keys) rather than readable user data, leveraging the public ledger for auditability rather than secrecy.

### 3. State Management & Rent
- **Tradeoff:** Creating distributed locks or role assignments requires allocating permanent storage (PDAs) and paying rent, unlike ephemeral Redis keys.
- **Constraint:** Unused state permanently consumes space and SOL if not managed.
- **Solution:** We implemented explicit `release_lock` and `revoke_role` instructions to close accounts, reclaim rent, and maintain a clean state tree.

---

## Devnet Transaction Links

| Action | Devnet Transaction Link |
| :--- | :--- |
| **Program Setup** | [View on Explorer](https://explorer.solana.com/address/X61sTdLaXMaAjdDE9UFSs36FoabSQMiXGS2uABzeJjB?cluster=devnet) |
| **Create Market Circuit** | [View on Explorer](https://explorer.solana.com/tx/sample_tx_circuit) |
| **Assign Treasurer Role** | [View on Explorer](https://explorer.solana.com/tx/sample_tx_role) |
| **Protected Operation** | [View on Explorer](https://explorer.solana.com/tx/sample_tx_op) |

---

## Audit Log Pattern
Every protected operation emits an on-chain **Audit Log** PDA. This ensures that every high-stakes action is permanently recorded and searchable, providing a level of transparency that surpasses traditional logging.
