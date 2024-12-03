FROM node:latest@sha256:a2fea8b0b74b6e828caa6d83f4b2a0dcb2eb1ff90f30205c32f7bd36ddf976c4

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
