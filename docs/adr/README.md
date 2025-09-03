# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the BFR Trainer project. ADRs document important architectural decisions made during the project's evolution.

## Format

Each ADR follows a standard format:
- **Title**: Brief description of the decision
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Context**: Background and motivation for the decision
- **Decision**: The chosen solution and approach
- **Consequences**: Expected outcomes, both positive and negative
- **Alternatives Considered**: Other options that were evaluated

## Index

- [ADR-0001: Multi-User Authentication and Persistence Architecture](0001-auth-architecture.md) - Documents the decision to implement Node.js/Fastify backend with PostgreSQL for multi-user support

## Guidelines for New ADRs

When creating new ADRs:
1. Use sequential numbering (0001, 0002, etc.)
2. Use descriptive but concise titles
3. Include thorough analysis of alternatives
4. Document both benefits and trade-offs
5. Update this README index

For more information about ADRs, see [Architecture Decision Records](https://adr.github.io/).