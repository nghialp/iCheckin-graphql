CI / CD deployment (GitHub Actions)
=================================

This repository includes a GitHub Actions workflow at `.github/workflows/ci-cd.yml` that will run on every push to `main`.

What the workflow does
- checkout the code
- set up Node.js and pnpm
- install dependencies, run tests, and build the project
- build a Docker image from `Dockerfile` and push it to GitHub Container Registry (ghcr.io)
- SSH to the server, pull the new image, and run it (replacing the previous container)

Required secrets
Add the following secrets to your repository (Settings → Secrets & variables → Actions):

- `DEPLOY_HOST` — server address (IP or hostname)
- `DEPLOY_USER` — SSH username on target server
- `DEPLOY_PORT` — (optional) SSH port, default 22
- `DEPLOY_PATH` — absolute path on server where the app should be deployed (used in docs; optional for container run)
- `DEPLOY_SSH_KEY` — private SSH key (PEM/openssh format) used to connect as `DEPLOY_USER`
- `DEPLOY_SSH_PASSPHRASE` — (optional) passphrase for the SSH key
- `DEPLOY_APP_PORT` — (optional) host port to map to container port 3000 (default 3000)

- `GHCR_USERNAME` — (optional) username to login to ghcr.io if the image is private
- `GHCR_PASSWORD` — (optional) password/token to login to ghcr.io (use a fine-grained token or PAT)
Additional secrets for clone-based deploy
- `DEPLOY_TOKEN` — (optional) a GitHub token or PAT used by the server to clone the repo via HTTPS when the repository is private. If not provided and the repo is private, configure a deploy key on the server or make the repo accessible to the deploy user.

Server prerequisites
On the target server make sure to have:

- Docker (required for the container-based deploy)
- docker-compose (optional) or the Docker v2 CLI (`docker compose`) — workflow uses `docker compose`
- If your image is private on ghcr.io, ensure the server can authenticate (the workflow will attempt to login if `GHCR_USERNAME`/`GHCR_PASSWORD` secrets are provided).

Notes and alternatives
- The workflow builds a Docker image and pushes it to GitHub Container Registry (`ghcr.io`). The workflow then SSHes to your server, writes or updates `docker-compose.prod.yml` under `DEPLOY_PATH` to reference the pushed image tag, runs `docker compose pull`, and `docker compose up -d` to start/replace the service.
- If you prefer to manage containers with `docker-compose` files already on the server, you can adjust the workflow to only `docker compose pull && docker compose up -d` without overwriting the compose file.
- To use Docker Hub or another registry, replace the `docker/login-action` and image names and add registry credentials as repository secrets.

Security
- Never commit secrets into the repo. Use GitHub Actions secrets as described above.
- Prefer using a deployment user with limited privileges or a dedicated deployment key. If the workflow needs to run privileged commands on the server, restrict `sudo` permissions to only the required commands.

Options I can implement next
- Push images to Docker Hub instead of GHCR.
- Change the remote deploy to rely on an existing server-side `docker-compose.yml` and run `docker compose pull && docker compose up -d`.
- Add a small `deploy/docker-compose.prod.yml.tpl` template to the repo that the workflow uploads and fills with the right image tag.

Tell me which option you'd like and I'll update the workflow accordingly.
