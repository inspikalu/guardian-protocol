# Solana Guardian Protocol

**Enterprise-grade distributed systems patterns for Solana programs.**

Solana Guardian Protocol provides traditional Web2 backend infrastructure patterns—role-based access control, circuit breakers, and distributed locks—reimagined as composable Solana programs. This project demonstrates how complex backend infrastructure can be rebuilt on-chain with transparency, auditability, and decentralization.

## Overview

The toolkit consists of three core components that can be used independently or composed together:

1. **Role-Based Access Control (RBAC):** On-chain role definitions, permission mapping, and time-bound access policies. Replaces Web2 systems like Auth0 or AWS IAM.
2. **Circuit Breaker:** Graceful failure handling and fault tolerance for cross-program invocations (CPI). Monitors external program health and prevents cascading failures. Replaces Web2 patterns like Netflix Hystrix or Resilience4j.
3. **Distributed Lock Manager (DLM):** Resource coordination and queue management for shared on-chain resources using PDA-based locking. Replaces Web2 systems like Redis Redlock or ZooKeeper.

### Example Use Case: Protected Treasury Operation

These components coordinate to secure sensitive operations:

1. **User Request:** A user requests a high-stakes capability (e.g., a treasury withdrawal).
2. **RBAC Check:** The RBAC Program verifies if the user possesses the correct role and valid permissions.
3. **Circuit Breaker Check:** The Circuit Breaker Program verifies the health of any downstream dependencies (e.g., pricing oracles).
4. **Lock Acquisition:** The Distributed Lock Manager acquires an exclusive lock on the treasury account to prevent race conditions or reentrancy.
5. **Execution:** The operation executes successfully.
6. **Cleanup:** The DLM releases the lock and an audit event is recorded.

## Project Structure

The repository is structured with an Anchor workspace for the on-chain programs and a Next.js frontend for the management dashboard:

- `/guardian_protocol` - Anchor workspace containing the smart contracts.
  - `programs/rbac` - Access control management.
  - `programs/circuit_breaker` - Fault tolerance tracking.
  - `programs/lock_manager` - Resource coordination.
  - `programs/orchestrator` - Example demonstration of all components working together.
- `/guardian-ui` - Next.js React application containing the Guardian Dashboard for interacting with the protocols visually.
- `/.local_notes` - Internal project planning and architecture reference documents.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)

### Building the Programs

Navigate to the Anchor workspace and build the programs:

```bash
cd guardian_protocol
anchor build
```

Run the Anchor test suite to verify the programs:

```bash
anchor test
```

### Running the Frontend

Navigate to the frontend directory, install dependencies, and start the development server:

```bash
cd guardian-ui
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Architecture Highlights

- **Trustless Delegation:** The RBAC logic enables cryptographic proof of permissions at any point in time without trusting centralized permission providers.
- **Global Coordination:** Solana's circuit breaker provides global state—all network callers observe the same circuit state, avoiding thundering herd problems on recovery.
- **Cryptographic Ownership:** Lock acquisition is cryptographically verifiable and relies on blockchain consensus rather than network latency, external quorum mechanisms, or trust wrappers.
