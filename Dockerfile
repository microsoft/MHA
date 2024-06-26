FROM node:latest@sha256:111df2ff1158e1bed721b6b6bd493baba6443493f8a0571c064cb3a0cddb178c

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
