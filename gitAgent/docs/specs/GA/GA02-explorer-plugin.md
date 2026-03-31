# GA02 - Git Explorer Plugin

## Summary

Pluginul `git-tool-button` este entrypoint-ul UI Git în Explorer și este montat în slotul `file-exp:toolbar`.

## Plugin Registration

Conform [config.json](/Users/adrianganga/Desktop/devWork/testExplorer/.ploinky/repos/gitAssistant/gitAgent/IDE-plugins/git-tool-button/config.json):

- `pluginCategory`: `application`
- `id`: `git`
- `location`: `file-exp:toolbar`
- `component`: `git-tool-button`

## Dependency Graph

Pluginul public încarcă și componente dependente precum:

- `git-commit-modal`
- `git-repo-tree`
- `git-commit-actions`
- `git-commit-body`
- `git-credentials-prompt`
- `git-diff-viewer`
- `git-conflict-helper`

## Ownership Rules

Explorer deține:

- slotul de toolbar
- host contextul curent
- refresh-ul generic de pagină

Git plugin deține:

- repo selection
- stage/unstage state
- commit flows
- GitHub auth prompts
- conflict UI

## Behavioral Specification

1. Explorer încarcă pluginul runtime
2. pluginul citește contextul curent din host
3. pluginul apelează `gitAgent` prin MCP
4. pluginul emite evenimente pentru refresh și close
