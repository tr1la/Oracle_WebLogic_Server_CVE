# Oracle WebLogic Server 12.2.1.4 lab

This lab runs the official Oracle Container Registry image as `linux/amd64` and exposes its administration ports only on the local machine.

## Start

1. Sign in to <https://container-registry.oracle.com/> and accept the license for `middleware/weblogic`.
2. Authenticate Docker:

   ```bash
   docker login container-registry.oracle.com
   ```

3. Start the lab:

   ```bash
   docker compose up -d
   docker compose logs -f weblogic server0
   ```

4. After both services are healthy, open <http://127.0.0.1:7001/console>.

The Compose configuration uses production mode but disables the dedicated Administration Port so that the local lab Console remains available over HTTP. Both the Console and WebLogic protocols are bound to localhost only.

The WebLogic domain is persisted from the host directory `./user_projects`.
`AdminServer` runs in service `weblogic` on port `7001`; managed server
`Server-0` runs in service `server0` on port `7003`.

The converted KTVAirline WAR is mounted read-only at:

```text
/u01/oracle/deployments/ktv-airline-wls12c.war
```

The application environment points to the local MySQL container through
`host.docker.internal:3307`. JWT keys and application data remain under
`./user_projects/domains/base_domain/lab-data`.

Runtime seed data is copied once into `lab-data` instead of bind-mounting the
whole application project. The persistent runtime directories are `uploads`,
`imports`, `custom_themes` and `templates/components`. Security payload and
report source directories are intentionally excluded.

The demo credentials are stored in `properties/domain.properties`. Change them before exposing the lab beyond localhost.

## Stop

```bash
docker compose stop
```

## Remove the container

This removes the container while preserving the domain in `./user_projects`:

```bash
docker compose down
```
