FROM node:latest@sha256:525d7cc45c28d0cc6ab50fe0abb6dd7620ed95489970fe5582cb77e8da2517a3

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present