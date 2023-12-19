FROM node:latest@sha256:e1416c4a29e44cc1705c63ac66a7b7a270b447b696d27ddb1d2aaf7488dc5569

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present