FROM node:latest@sha256:8a4e437f8f114697af2c0ab93fd0c4909b3eafac23541ac649f1d4b5d3eae3cc

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i --package-lock-only && npm ci && npm run build --if-present
