# Tested release promotion

`platform.yml` checks pull requests without deployment credentials. Internal pushes
run the same gates, build four ARM64 images, encrypt initial environment secrets,
and commit immutable digests to `ksi-cluster`. `master` is production.
The old auto-format-and-commit workflow is removed. Formatting is a read-only gate.

```sh
python3 -m unittest discover -s scripts/deployment -p 'test_*.py'
```

`deploy.py` renders files locally. It requires full commit SHAs, four digest references,
and encrypted runtime secrets. `secrets.py` needs SOPS and an age public recipient;
it never prints secrets. Existing branch secrets are preserved to keep sessions and
database passwords stable. Rotate secrets explicitly by editing encrypted manifests.

Frontend containers receive only `PROXY_SECRET`, public configuration and the internal
backend address. The backend and worker receive database, OAuth, SMTP and R2 secrets.
The API image retains migration tooling, `pg_dump`, `pg_restore` and OpenSSL. Images
are deliberately larger initially; prune dependencies after Docker validation.

Configure GitHub environments `production` and `preview`, a fine-grained
`CLUSTER_WRITE_TOKEN` limited to cluster content, and variable `SOPS_AGE_RECIPIENT`.
Use distinct production/preview credentials. GitHub OAuth secret names are
`OAUTH_GITHUB_ID` / `OAUTH_GITHUB_SECRET` to avoid reserved prefixes;
runtime names are identical. See `environment.example` for other names.
`CLOUDFLARE_ZONE_ID`, `PREVIEW_DNS_TARGET`, `ACTIVATION_CONTACT`, and `R2_PUBLIC_ORIGIN` are
GitHub variables. R2 credentials must authorize only the respective environment buckets.

Preview DNS points to the configured ingress hostname through Cloudflare, never to
Talos administration. Records are marked as KSI-owned; unmanaged records cannot be
overwritten. A failed final push can leave unused marked DNS records; promotion is
idempotent and deletion cleanup removes them.

Cluster-write jobs serialize and verify the branch still references the built commit.
Non-fast-forward pushes fail safely. A branch advancing during the final request can
briefly receive its previous tested commit; the next successful run replaces it.
This guarantees tested builds, not an atomic lock on a GitHub branch ref.

Deleted branches remove Flux definitions and queue cleanup. A cluster CronJob waits
until namespace pruning is complete, drops the preview DB/role, deletes the matching
prefix in preview R2 buckets and removes marked DNS records. Failures retry. Completed
queue records remain for inspection. Cancel an outstanding cleanup queue before
recreating the same branch name; promotion rejects reuse while a cleanup record exists.

Complete `ksi-cluster/README.md` bootstrap before enabling promotion. These files do
not install Flux, supply credentials, reset data or prove a live rollout. The fixed
preview OAuth callback broker remains an application integration requirement; register
per-preview callbacks or disable preview social login until it exists. Production
provider credentials and auth cookies must never be reused by previews.
