FROM node:latest@sha256:69cf8e7dcc78e63db74ca6ed570e571e41029accdac21b219b6ac57e9aca63cf

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present