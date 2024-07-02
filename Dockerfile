FROM node:latest@sha256:2ecc619ef7de3561b7fee81d1ff16da35ce4f0fed1f35caa3574826789a6f0d6

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
