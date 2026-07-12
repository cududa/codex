Mental Model

Cargo itself is not a good routing layer. It expects “run this here.” just or a small Python/PowerShell runner
is the right routing layer.

Responsibility split:

Mac host:
- cargo check
- cargo nextest / focused Rust tests
- JS/SDK tests
- fmt/lint where platform-neutral
- broad confidence gates for normal local changes

Windows VM:
- Windows local-release codex.exe build
- scripts\stage_local_codex_sdk_bundle.py
- npm global install/local package staging
- tiny Windows smoke checks if needed

Given your workflow, this fits well: most changes are behavioral/integration changes, and you trust upstream
for deep Windows-specific correctness. So the Mac gives fast signal; the VM only pays the Windows cost when
producing the thing you actually install.

The Important Part: Snapshot Sync

I would not use a Parallels shared folder as the build workspace. That often makes Rust worse.

I’d use two real clones:

Windows VM:
C:\Users\...\codex-pinned

Mac host:
~/src/codex-pinned

Then every delegated test/build starts by forcing the Mac clone to match a snapshot of the VM repo.
3. Mac checks out/updates a dedicated worktree.
4. Mac applies uncommitted tracked and untracked changes.
5. Mac runs the requested command.
6. Results/logs come back to Windows.

This avoids “did I sync?” as a human concern. The command itself syncs first.

How To Represent Dirty Work

There are two good options.

Option A: temporary WIP commit/bundle

VM creates temporary commit including tracked + untracked changes
VM pushes/bundles it to Mac
Mac checks out exactly that commit
Mac runs tests
VM does not alter user's real branch history

This is the most reliable if implemented carefully, probably with a temporary detached worktree or stash-like
commit object.

Option B: base commit +text HEAD and overlays```

This avoids temporary,, executable bits, and ignored generated files.

I’d prefer Option A.

Command UX

Eventually you get recipes like:

just test-host -p codex-core some_filter
just check-host -p codex-cli
just sdk-windows
just local-gate

Where:

just test-host
  -> sync VM snapshot to Mac
  -> run cargo nextest on Mac
  -> return exit code/log summary

just sdk-windows
  -> run Windows local SDK staging/install in VM

just local-gate
  -> sync and run host tests
  -> if pass, run Windows SDK build/install

If you want this even more seamless, just test on Windows can become the delegated host route by default. I
would not try to make raw cargo test magically remote unless we intentionally build a cargo shim. That is
possible, but it is a sharper tool and easier to make confusing.

Why This Could Help A Lot

The Mac host avoids Parallels CPU scheduling, Windows filesystem overhead, MSVC/link/PDB cost for tests, and VM
disk contention. Rust test/check builds on native Apple Silicon should be much less painful.

The VM still handles the only thing that really must be Windows-native for your current flow: the installed
Windows codex.exe/npm package route.

The key design rule: no background bidirectional sync. Every routed command creates a precise one-way snapshot
from VM to Mac, runs against that, and reports back. That keeps it deterministic and avoids spooky “which
machine has the real file?” problems.