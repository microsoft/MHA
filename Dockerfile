FROM node:latest@sha256:14bd39208dbc0eb171cbfb26ccb9ac09fa1b2eba04ccd528ab5d12983fd9ee24

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present