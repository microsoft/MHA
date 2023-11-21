FROM node:latest@sha256:6b5c0daae8d06fc0da5a9bb835b3403654b466a956309e4e806f6a8da8d9807c

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present