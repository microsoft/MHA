FROM node:latest@sha256:a9875b5ccb02aa527cf7f2297b16ae425a0ff3da2f7d87fce3df41f04ffa0524

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
