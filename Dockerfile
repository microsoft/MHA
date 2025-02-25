FROM node:latest@sha256:afc42b3ae450aaa70a000183a9ee31354691b8f47ad4b833a8e7c10adcc724ae

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
