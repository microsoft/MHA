FROM node:latest@sha256:bf718fc580177cd927173c8617cf7f527a1b7f62c7de882ee17a42d065f4b70e

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present