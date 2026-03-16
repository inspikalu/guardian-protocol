export const IDL = 
{
  "address": "X61sTdLaXMaAjdDE9UFSs36FoabSQMiXGS2uABzeJjB",
  "metadata": {
    "name": "orchestrator",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "protected_operation",
      "docs": [
        "Execute a protected operation through all 3 guardian systems:",
        "RBAC → Circuit Breaker → Lock Manager → Execute → Release → Audit"
      ],
      "discriminator": [
        132,
        111,
        147,
        76,
        180,
        206,
        84,
        201
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "rbac_role"
        },
        {
          "name": "rbac_assignment"
        },
        {
          "name": "audit_log",
          "writable": true
        },
        {
          "name": "rbac_program",
          "address": "EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS"
        },
        {
          "name": "circuit",
          "writable": true
        },
        {
          "name": "circuit_breaker_program",
          "address": "9GXUR2xcVDxnu1JNEdDqCrLRL9K44t5iYxcTWekMaPma"
        },
        {
          "name": "lock",
          "writable": true
        },
        {
          "name": "lock_receipt",
          "writable": true
        },
        {
          "name": "lock_manager_program",
          "address": "reMMumQqHvHcQWJnyURAASgsp3zomq6cLdW3dUyyZ7j"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "required_permission",
          "type": {
            "defined": {
              "name": "Permission"
            }
          }
        },
        {
          "name": "lease_duration",
          "type": "i64"
        },
        {
          "name": "audit_counter",
          "type": "u64"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PermissionDenied",
      "msg": "RBAC permission check failed"
    },
    {
      "code": 6001,
      "name": "CircuitOpen",
      "msg": "Circuit breaker is OPEN — operation blocked"
    },
    {
      "code": 6002,
      "name": "LockUnavailable",
      "msg": "Lock is unavailable — already held by another"
    }
  ],
  "types": [
    {
      "name": "Permission",
      "docs": [
        "Permissions that can be assigned to a role."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TreasuryWithdraw",
            "fields": [
              {
                "name": "max_amount",
                "type": "u64"
              }
            ]
          },
          {
            "name": "TreasuryDeposit"
          },
          {
            "name": "RoleManagement"
          },
          {
            "name": "EmergencyStop"
          },
          {
            "name": "ViewAudit"
          },
          {
            "name": "AcquireLock"
          }
        ]
      }
    }
  ]
};
