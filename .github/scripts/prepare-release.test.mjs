import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareRelease } from './prepare-release.mjs';

function fixture({ existingTag = false, releases = [], files = {}, failList = false } = {}) {
  const calls = [];
  const contents = {
    'package.json': '{"version":"0.1.0"}',
    'package-lock.json': '{"version":"0.1.0","packages":{"":{"version":"0.1.0"}}}',
    'src-tauri/tauri.conf.json': '{"version":"0.1.0"}',
    'src-tauri/Cargo.toml': '[package]\nname = "game-hub"\nversion = "0.1.0"\n',
    'src-tauri/Cargo.lock': 'version = 4\n[[package]]\nname = "game-hub"\nversion = "0.1.0"\n',
    ...files,
  };
  const env = {
    GH_REPO: 'owner/repo',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    REQUESTED_TAG: '',
  };
  const run = (program, args) => {
    calls.push([program, ...args]);
    if (program === 'git') {
      if (args[0] === 'show') {
        const path = args[1].split(':')[1];
        assert.ok(path in contents, `Unexpected file: ${path}`);
        return contents[path];
      }
      if (args[0] === 'tag') return existingTag ? args[2] : '';
      if (args[0] === 'rev-parse') return 'a'.repeat(40);
    }
    if (program === 'gh') {
      if (args.includes('--paginate')) {
        if (failList) throw new Error('HTTP 403');
        return JSON.stringify([releases]);
      }
      if (args.includes('repos/owner/repo/git/refs')) return '{}';
      if (args.includes('repos/owner/repo/releases')) return '{"id":42}';
    }
    assert.fail(`Unexpected command: ${program} ${args.join(' ')}`);
  };
  return { env, run, calls };
}

test('manual run derives a tag, creates it at HEAD, and captures the draft ID directly', () => {
  const f = fixture();
  assert.deepEqual(prepareRelease(f.env, f.run), {
    tag: 'v0.1.0',
    commit: 'a'.repeat(40),
    release_id: 42,
  });
  assert.ok(f.calls.some(call => call.includes('ref=refs/tags/v0.1.0')));
  assert.ok(f.calls.some(call => call.includes(`sha=${'a'.repeat(40)}`)));
  assert.ok(f.calls.some(call => call.includes('draft=true')));
  assert.ok(!f.calls.some(call => call.some(arg => arg.includes('/releases/tags/'))));
});

test('an existing tag uses its commit and reuses a draft without writes', () => {
  const f = fixture({ existingTag: true, releases: [{ id: 7, tag_name: '0.1.0', draft: true }] });
  f.env.REQUESTED_TAG = '0.1.0';
  assert.equal(prepareRelease(f.env, f.run).release_id, 7);
  assert.ok(f.calls.some(call => call.includes('refs/tags/0.1.0^{commit}')));
  assert.ok(!f.calls.some(call => call.includes('POST')));
  assert.ok(f.calls.filter(call => call[1] === 'show').every(call => call[2].startsWith('a'.repeat(40))));
});

test('tag push uses the event tag, not a manual input', () => {
  const f = fixture({ existingTag: true });
  Object.assign(f.env, {
    GITHUB_EVENT_NAME: 'push',
    GITHUB_REF_NAME: '0.1.0',
    REQUESTED_TAG: 'v9.9.9',
  });
  assert.equal(prepareRelease(f.env, f.run).tag, '0.1.0');
  assert.ok(!f.calls.some(call => call.includes('repos/owner/repo/git/refs')));
});

test('tag push cannot silently recreate a missing tag', () => {
  const f = fixture();
  Object.assign(f.env, { GITHUB_EVENT_NAME: 'push', GITHUB_REF_NAME: 'v0.1.0' });
  assert.throws(() => prepareRelease(f.env, f.run), /nao foi encontrada/);
});

test('published releases are never overwritten', () => {
  const f = fixture({ existingTag: true, releases: [{ id: 7, tag_name: 'v0.1.0', draft: false }] });
  assert.throws(() => prepareRelease(f.env, f.run), /ja foi publicada/);
  assert.ok(!f.calls.some(call => call.includes('POST')));
});

for (const [path, content] of [
  ['package.json', '{"version":"0.2.0"}'],
  ['package-lock.json', '{"version":"0.2.0","packages":{"":{"version":"0.1.0"}}}'],
  ['package-lock.json', '{"version":"0.1.0","packages":{"":{"version":"0.2.0"}}}'],
  ['src-tauri/tauri.conf.json', '{"version":"0.2.0"}'],
  ['src-tauri/Cargo.toml', '[package]\nname = "game-hub"\nversion = "0.2.0"\n'],
  ['src-tauri/Cargo.lock', '[[package]]\nname = "game-hub"\nversion = "0.2.0"\n'],
]) {
  test(`rejects version mismatch in ${path} before any API calls (${content})`, () => {
    const f = fixture({ files: { [path]: content } });
    f.env.REQUESTED_TAG = 'v0.1.0';
    assert.throws(() => prepareRelease(f.env, f.run), /versoes devem coincidir/);
    assert.ok(!f.calls.some(call => call[0] === 'gh'));
  });
}

test('rejects malformed tags before writes', () => {
  for (const tag of ['main', 'v01.0.0', 'v1.0', 'v1.0.0\ninjected=value']) {
    const f = fixture();
    f.env.REQUESTED_TAG = tag;
    assert.throws(() => prepareRelease(f.env, f.run), /formato/);
    assert.ok(!f.calls.some(call => call[0] === 'gh'));
  }
});

test('API errors are not interpreted as a missing release', () => {
  const f = fixture({ failList: true });
  assert.throws(() => prepareRelease(f.env, f.run), /HTTP 403/);
  assert.ok(!f.calls.some(call => call.includes('POST')));
});
