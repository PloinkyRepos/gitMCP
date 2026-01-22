import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function safeParseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function stripFences(text) {
  return String(text || '')
    .trim()
    .replace(/^\s*```[\s\S]*?\n/, '')
    .replace(/\n```[\s\S]*$/m, '')
    .trim();
}

async function loadWorkspaceLlmModule(workspaceRoot) {
  if (!workspaceRoot) {
    throw new Error('WORKSPACE_ROOT is not set; cannot locate achillesAgentLib.');
  }
  const modulePath = path.join(workspaceRoot, 'node_modules', 'achillesAgentLib', 'LLMAgents', 'index.mjs');
  try {
    await fs.access(modulePath);
  } catch {
    throw new Error(`LLM library not found at ${modulePath}. Ensure Ploinky dependencies are installed in the workspace.`);
  }
  return import(pathToFileURL(modulePath).href);
}

async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function resolveWorkspaceRoot(context = {}) {
  const envCandidates = [
    context.workspaceRoot,
    process.env.WORKSPACE_ROOT,
    process.env.ASSISTOS_FS_ROOT,
    process.env.PLOINKY_WORKSPACE_ROOT
  ].filter((value) => typeof value === 'string' && value.trim());

  const baseCandidates = [
    ...envCandidates,
    '/workspace',
    '/code',
    '/Agent',
    '/',
    process.cwd()
  ];

  const moduleSuffix = path.join('node_modules', 'achillesAgentLib', 'LLMAgents', 'index.mjs');

  for (const base of baseCandidates) {
    const modulePath = path.join(base, moduleSuffix);
    if (await pathExists(modulePath)) {
      return base;
    }
  }

  let current = process.cwd();
  while (current && current !== path.dirname(current)) {
    const modulePath = path.join(current, moduleSuffix);
    if (await pathExists(modulePath)) {
      return current;
    }
    current = path.dirname(current);
  }

  throw new Error('WORKSPACE_ROOT is not set and achillesAgentLib was not found.');
}

function buildPrompt({ base = '', ours = '', theirs = '', source = '' } = {}) {
  const preferTheirs = String(source || '').toLowerCase().includes('stash');
  const header = [
    'You are resolving a git merge conflict for a single file.',
    'Return ONLY the fully resolved file content.',
    'Do NOT include conflict markers, markdown, or explanations.',
    preferTheirs
      ? 'Strategy: prefer THEIRS (stashed local changes) and do NOT merge OURS unless it adds missing lines without altering THEIRS intent.'
      : 'Strategy: prefer OURS (local); only include THEIRS when it is clearly additive and does not alter OURS intent.',
    source ? `Conflict source: ${source}` : '',
    '',
    '[BASE]',
    base || '',
    '[/BASE]',
    '',
    '[OURS]',
    ours || '',
    '[/OURS]',
    '',
    '[THEIRS]',
    theirs || '',
    '[/THEIRS]'
  ].filter(Boolean).join('\n');
  return header;
}

export default async function resolveConflict(input, context = {}) {
  let payload = input;
  if (typeof payload === 'string') {
    const parsed = safeParseJson(payload.trim());
    if (parsed) payload = parsed;
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid input. Expected { base, ours, theirs, source? }.');
  }
  const base = String(payload.base ?? '');
  const ours = String(payload.ours ?? '');
  const theirs = String(payload.theirs ?? '');
  const source = String(payload.source ?? '');

  if (!ours && !theirs) {
    throw new Error('Missing ours/theirs content.');
  }

  const workspaceRoot = await resolveWorkspaceRoot(context);
  const llm = await loadWorkspaceLlmModule(workspaceRoot);
  const agent = (typeof llm.getDefaultLLMAgent === 'function' && llm.getDefaultLLMAgent())
    || (typeof llm.registerDefaultLLMAgent === 'function' && llm.registerDefaultLLMAgent());
  if (!agent) {
    throw new Error('No default LLM agent available.');
  }

  const prompt = buildPrompt({ base, ours, theirs, source });
  const raw = await agent.executePrompt(prompt, { mode: 'fast', responseShape: 'text' });
  const resolved = stripFences(raw);
  if (!resolved) {
    throw new Error('AI returned an empty resolution.');
  }
  return resolved;
}
