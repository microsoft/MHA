FROM node:latest@sha256:5e4044ff6001d06e7748e35bfa4f80c73cf5f5a7360a1b782995e038a01b0585

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
