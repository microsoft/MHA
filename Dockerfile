FROM node:latest@sha256:c8a559f733bf1f9b3c1d05b97d9a9c7e5d3647c99abedaf5cdd3b54c9cbb8eff

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
