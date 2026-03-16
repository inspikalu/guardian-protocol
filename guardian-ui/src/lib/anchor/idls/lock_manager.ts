export const IDL = 
{
  "address": "reMMumQqHvHcQWJnyURAASgsp3zomq6cLdW3dUyyZ7j",
  "metadata": {
    "name": "lock_manager",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acquire_lock",
      "docs": [
        "Acquire a lock. Errors if already held. Supports reentrancy."
      ],
      "discriminator": [
        101,
        3,
        93,
        16,
        193,
        193,
        148,
        175
      ],
      "accounts": [
        {
          "name": "acquirer",
          "writable": true,
          "signer": true
        },
        {
          "name": "lock",
          "writable": true
        },
        {
          "name": "receipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lock"
              },
              {
                "kind": "account",
                "path": "acquirer"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "lease_duration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "create_lock",
      "docs": [
        "Create a new distributed lock for a resource."
      ],
      "discriminator": [
        171,
        216,
        92,
        167,
        165,
        8,
        153,
        90
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "lock",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107
                ]
              },
              {
                "kind": "arg",
                "path": "resource_id"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "resource_id",
          "type": "string"
        },
        {
          "name": "max_lease_duration",
          "type": "i64"
        },
        {
          "name": "allow_reentrancy",
          "type": "bool"
        }
      ]
    },
    {
      "name": "expire_lock",
      "docs": [
        "Permissionless — clean up a lock whose lease has already expired."
      ],
      "discriminator": [
        63,
        152,
        206,
        123,
        101,
        134,
        1,
        97
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Permissionless: anyone can call this to clean up an expired lock."
          ],
          "signer": true
        },
        {
          "name": "lock",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "extend_lock",
      "docs": [
        "Extend the caller's current lease duration."
      ],
      "discriminator": [
        68,
        151,
        140,
        144,
        139,
        122,
        118,
        170
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "lock",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "additional_seconds",
          "type": "i64"
        }
      ]
    },
    {
      "name": "force_unlock",
      "docs": [
        "Force-release any lock (authority only)."
      ],
      "discriminator": [
        58,
        109,
        237,
        172,
        14,
        199,
        201,
        21
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "lock",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "release_lock",
      "docs": [
        "Release a lock held by the caller."
      ],
      "discriminator": [
        241,
        251,
        248,
        8,
        198,
        190,
        195,
        6
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "lock",
          "writable": true
        },
        {
          "name": "receipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lock"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "DistributedLock",
      "discriminator": [
        80,
        49,
        230,
        96,
        224,
        205,
        164,
        45
      ]
    },
    {
      "name": "LockReceipt",
      "discriminator": [
        38,
        16,
        139,
        16,
        83,
        25,
        174,
        172
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "LockAlreadyAcquired",
      "msg": "The lock is already held by another owner"
    },
    {
      "code": 6001,
      "name": "NotLockOwner",
      "msg": "The caller is not the lock owner"
    },
    {
      "code": 6002,
      "name": "LockExpired",
      "msg": "The lock lease has expired"
    },
    {
      "code": 6003,
      "name": "Unauthorized",
      "msg": "Only the lock authority can perform this action"
    },
    {
      "code": 6004,
      "name": "ResourceIdTooLong",
      "msg": "Resource ID is too long (max 64 chars)"
    },
    {
      "code": 6005,
      "name": "LeaseTooLong",
      "msg": "The requested lease duration exceeds the maximum"
    },
    {
      "code": 6006,
      "name": "ReentrancyNotAllowed",
      "msg": "Reentrancy is not allowed for this lock"
    }
  ],
  "types": [
    {
      "name": "DistributedLock",
      "docs": [
        "The on-chain distributed lock resource account."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "resource_id",
            "docs": [
              "Unique identifier for the resource (e.g., \"treasury_account\")"
            ],
            "type": "string"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "LockState"
              }
            }
          },
          {
            "name": "authority",
            "docs": [
              "The authority who can force-unlock or administer this lock."
            ],
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "acquired_at",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "expires_at",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "max_lease_duration",
            "docs": [
              "Maximum allowed lease duration in seconds."
            ],
            "type": "i64"
          },
          {
            "name": "allow_reentrancy",
            "docs": [
              "If true, the same owner can acquire multiple times (increments counter)."
            ],
            "type": "bool"
          },
          {
            "name": "reentrancy_count",
            "type": "u8"
          },
          {
            "name": "total_acquisitions",
            "type": "u64"
          },
          {
            "name": "total_contentions",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "LockReceipt",
      "docs": [
        "A receipt PDA proving the current holder's ownership (seeded by lock + owner)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lock",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "acquired_at",
            "type": "i64"
          },
          {
            "name": "lease_expires",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "LockState",
      "docs": [
        "The state of a distributed lock."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Available"
          },
          {
            "name": "Locked"
          },
          {
            "name": "Expired"
          }
        ]
      }
    }
  ]
};
