FROM node:latest@sha256:3b73c4b366d490f76908dda253bb4516bbb3398948fd880d8682c5ef16427eca

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
