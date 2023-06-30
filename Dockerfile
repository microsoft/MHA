FROM node:latest@sha256:2f0b0c15f97441defa812268ee943bbfaaf666ea6cf7cac62ee3f127906b35c6

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present