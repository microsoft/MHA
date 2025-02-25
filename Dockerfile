FROM node:latest@sha256:89832d6c472e744355c3751da68d60d8f79bb20a79fe7497672d4099b898a7f4

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
