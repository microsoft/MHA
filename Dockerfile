FROM node:latest@sha256:8d9887b3b05d2e65598a18616c37cfc271346d12248dfcbeadd7b7bf4da1e827

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present