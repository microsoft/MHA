FROM node:latest@sha256:d3ee0a2a4db7a41c2e13a75caa40308546711122067f7ae48a9df7529c2d8070

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
