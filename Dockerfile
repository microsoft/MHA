FROM node:latest@sha256:e940261391ab78a883bbcfba448bcbb6d36803053f67017e6e270ef095f213ca

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
