FROM node:latest@sha256:e49d3d153f2dc9b74ad8477471cdc64db85f3fe3de1620befe21786fe6e6a0cb

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
