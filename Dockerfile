FROM node:latest@sha256:e71e3faf491dc47c9fcbca9240c3518d3b7d81094773f7e944f6ae4f64911cb8

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
