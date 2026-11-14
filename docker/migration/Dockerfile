FROM ghcr.io/pipettegh/borngreataccounting-api:latest AS build

ARG DB_HOST= \
  DB_USER= \
  DB_PASSWORD= \
  DB_CHARSET= \
  SYSTEM_DB_NAME= \
  SYSTEM_DB_PASSWORD= \
  SYSTEM_DB_USER= \
  SYSTEM_DB_HOST= \
  SYSTEM_DB_CHARSET=

ENV DB_HOST=$DB_HOST \
  DB_USER=$DB_USER \
  DB_PASSWORD=$DB_PASSWORD \
  DB_CHARSET=$DB_CHARSET \
  SYSTEM_DB_HOST=$SYSTEM_DB_HOST \
  SYSTEM_DB_USER=$SYSTEM_DB_USER \
  SYSTEM_DB_PASSWORD=$SYSTEM_DB_PASSWORD \
  SYSTEM_DB_NAME=$SYSTEM_DB_NAME \
  SYSTEM_DB_CHARSET=$SYSTEM_DB_CHARSET

USER root
RUN apk update && \
  apk upgrade && \
  apk add --no-cache git bash netcat-openbsd

WORKDIR /app/packages/server

RUN git clone https://github.com/vishnubob/wait-for-it.git

CMD ./wait-for-it/wait-for-it.sh mysql:3306 -- sh -c "node dist/cli.js system:migrate:latest && node dist/cli.js tenants:migrate:latest"
