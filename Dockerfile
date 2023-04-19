FROM node:lts-alpine

LABEL maintainer="wangziling"
LABEL com.docker.compose.project=artus-web

# For better Chinese support.
ENV LANG="C.UTF-8"

WORKDIR /app/

COPY ./sling-artus-web-*.tgz /app/

RUN tar -xzf *.tgz -C ./ \
    && mv ./package/* . \
    && rm -rf ./package \
    && rm -rf ./sling-artus-web-*.tgz

RUN npm config set registry=https://registry.npmmirror.com --global \
    && npm install -g pnpm pm2 \
    && SHELL=bash pnpm setup \
    && source /root/.bashrc \
    && pnpm i

EXPOSE 9527

CMD ["/bin/sh", "-c", "pm2-runtime start '/app/docker-pm2-process.config.js'"]
