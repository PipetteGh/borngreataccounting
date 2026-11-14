# ==============================================================================
# BorngreatAccounting — MariaDB Production Database Image (docker/database/Dockerfile)
# ==============================================================================
FROM mariadb:10.11

LABEL org.opencontainers.image.title="BorngreatAccounting MariaDB" \
      org.opencontainers.image.description="MariaDB 10.11 configured for BorngreatAccounting multi-tenant databases" \
      org.opencontainers.image.vendor="Borngreat (Peter Borngreat-Mensah)" \
      org.opencontainers.image.licenses="AGPL-3.0"

COPY ./docker/mariadb/my.cnf /etc/mysql/conf.d/borngreat.cnf
COPY ./docker/mariadb/docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/

EXPOSE 3306
