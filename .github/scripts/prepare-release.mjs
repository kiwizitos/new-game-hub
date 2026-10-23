import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function command(program, args) {
  return execFileSync(program, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
}

export function prepareRelease(env = process.env, run = command) {
  const git = (...args) => run('git', args);
  const api = (...args) => JSON.parse(run('gh', ['api', ...args]));
  const repo = `repos/${env.GH_REPO}`;
  const read = (ref, path) => git('show', `${ref}:${path}`);
  const manual = env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  const requested = manual ? env.REQUESTED_TAG?.trim() : env.GITHUB_REF_NAME;
  const tag = requested || `v${JSON.parse(read('HEAD', 'package.json')).version}`;

  if (!/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error('Use uma tag no formato vX.Y.Z ou X.Y.Z, sem zeros iniciais.');
  }

  const tags = git('tag', '--list', tag);
  if (!tags && !manual) {
    throw new Error(`A tag ${tag} nao foi encontrada.`);
  }

  const commit = git(
    'rev-parse',
    '--verify',
    tags ? `refs/tags/${tag}^{commit}` : 'HEAD',
  );
  const pkg = JSON.parse(read(commit, 'package.json'));
  const lock = JSON.parse(read(commit, 'package-lock.json'));
  const tauri = JSON.parse(read(commit, 'src-tauri/tauri.conf.json'));
  const cargo = read(commit, 'src-tauri/Cargo.toml');
  const cargoPackage = cargo.split(/^\[/m).find(section => section.startsWith('package]'));
  const cargoVersion = cargoPackage?.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
  const cargoName = cargoPackage?.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
  const cargoLock = read(commit, 'src-tauri/Cargo.lock')
    .split('[[package]]')
    .find(section => section.match(/^name\s*=\s*"([^"]+)"/m)?.[1] === cargoName);
  const versions = {
    'package.json': pkg.version,
    'package-lock.json': lock.version,
    'package-lock.json (root)': lock.packages?.['']?.version,
    'tauri.conf.json': tauri.version,
    'Cargo.toml': cargoVersion,
    'Cargo.lock': cargoLock?.match(/^version\s*=\s*"([^"]+)"/m)?.[1],
  };

  if (Object.values(versions).some(version => version !== tag.replace(/^v/, ''))) {
    throw new Error(`A tag ${tag} e todas as versoes devem coincidir: ${JSON.stringify(versions)}`);
  }

  // The release-by-tag endpoint does not return drafts; list releases instead.
  const releases = api(`${repo}/releases?per_page=100`, '--paginate', '--slurp').flat();
  let release = releases.find(item => item.tag_name === tag);
  if (release && !release.draft) {
    throw new Error(`A release ${tag} ja foi publicada; use uma nova versao.`);
  }

  if (!tags) {
    api(
      '--method',
      'POST',
      `${repo}/git/refs`,
      '-f',
      `ref=refs/tags/${tag}`,
      '-f',
      `sha=${commit}`,
    );
  }

  if (!release) {
    release = api(
      '--method',
      'POST',
      `${repo}/releases`,
      '-f',
      `tag_name=${tag}`,
      '-f',
      `target_commitish=${commit}`,
      '-f',
      `name=Game Dev Hub ${tag}`,
      '-F',
      'draft=true',
      '-F',
      'prerelease=true',
      '-f',
      'body=Versao de teste. Baixe o instalador do seu sistema nos Assets. Os aplicativos nao possuem assinatura digital; Windows e macOS podem exibir avisos ou bloquear a execucao.',
    );
  }

  if (!Number.isSafeInteger(release.id) || release.id <= 0) {
    throw new Error('O GitHub nao retornou um ID de release valido.');
  }

  return { release_id: release.id, tag, commit };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outputs = prepareRelease();
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`).join(''),
  );
  console.log(`Rascunho ${outputs.release_id}: ${outputs.tag} (${outputs.commit})`);
}
