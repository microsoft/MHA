FROM node:latest@sha256:21505ae2f9f4b29ad9091e6dfc6c56ef9e890a16fc38fe6f6cd9ba3e979ef37c

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present