# GA01 - Git Agent Overview

## Summary

`gitAgent` este agentul MCP responsabil pentru operații Git în workspace-ul Ploinky și pentru integrarea UI Git din Explorer.

## Background / Problem Statement

Workspace-ul are nevoie de un strat Git sigur și reutilizabil care să nu lege Explorer direct de comenzi shell sau de detalii ale stării repo-urilor.

## Goals

1. Expunerea operațiilor Git prin MCP
2. Constrângerea accesului la rădăcinile valide din workspace
3. Oferirea unei integrări UI dedicate pentru Explorer

## Non-Goals

- a deveni un client Git generic pentru orice path de pe sistem
- a muta UI-ul Git în Explorer core

## Architecture Overview

| Area | Responsibility |
|---|---|
| `tools/git_tool.sh` + `tools/git_tool.mjs` | dispatch shell + logică principală |
| `lib/` | validare path, auth GitHub, tool handlers |
| `IDE-plugins/git-tool-button/` | integrarea UI pentru Explorer |

## API Contracts

Toolurile principale includ:

- `git_info`
- `git_status`
- `git_diff`
- `git_commit`
- `git_push`
- `git_pull`
- `git_stash`
- `git_commit_message`

## Configuration

Variabile relevante:

- `ASSISTOS_FS_ROOT`
- `WORKSPACE_ROOT`
- `PLOINKY_WORKSPACE_ROOT`
- `PLOINKY_GITHUB_CLIENT_ID`
- `PLOINKY_GITHUB_CLIENT_SECRET`
- `PLOINKY_GITHUB_SCOPE`

## Related Specs

- [GA02 - Explorer Plugin](/Users/adrianganga/Desktop/devWork/testExplorer/.ploinky/repos/gitAssistant/gitAgent/docs/specs/GA/GA02-explorer-plugin.md)
