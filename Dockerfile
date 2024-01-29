FROM node:latest@sha256:0ded28778059262bd3c066b609186e5b6c89550a9362dce4309ad67c95af0d77

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present