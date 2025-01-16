FROM node:latest@sha256:8ec46835f28cc572d67820fc56a6c5ab7d08c6e9b690ae6941aad462943e152e

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
