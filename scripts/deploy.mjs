import { execSync } from 'node:child_process';
import { existsSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BRANCH = 'deploy';
const WT = '.deploy-worktree';
const DIST = 'dist';
const root = process.cwd();

const run = (cmd, cwd = root) => execSync(cmd, { stdio: 'inherit', cwd });
const quiet = (cmd, cwd = root) => {
  try {
    execSync(cmd, { stdio: 'ignore', cwd });
    return true;
  } catch {
    return false;
  }
};

// 1. Сборка под GitHub Pages (base = /artic-store/)
execSync('vite build', { stdio: 'inherit', env: { ...process.env, VITE_BASE: 'artic-store' } });

// 2. Чистый worktree на ветке deploy
quiet(`git worktree remove ${WT} --force`);
rmSync(WT, { recursive: true, force: true });
quiet('git worktree prune');

if (quiet(`git rev-parse --verify ${BRANCH}`)) {
  run(`git worktree add ${WT} ${BRANCH}`);
} else {
  run(`git worktree add --detach ${WT}`);
  run('git switch --orphan ' + BRANCH, WT);
}

// 3. Содержимое ветки = свежий dist
for (const entry of readdirSync(WT)) {
  if (entry !== '.git') rmSync(join(WT, entry), { recursive: true, force: true });
}
for (const entry of readdirSync(DIST)) {
  if (entry !== '.git') cpSync(join(DIST, entry), join(WT, entry), { recursive: true });
}

// 4. Коммит и пуш (только при изменениях)
run('git add -A', WT);
if (quiet('git diff --cached --quiet', WT)) {
  console.log('Деплой: изменений нет.');
} else {
  run('git commit -m "Сборка для GitHub Pages (демо)"', WT);
  run(`git push -f origin ${BRANCH}`, WT);
  console.log('Деплой обновлён: https://romanzhan.github.io/artic-store/');
}

// 5. Уборка
quiet(`git worktree remove ${WT} --force`);
