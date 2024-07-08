FROM node:latest@sha256:2558f19e787cb0baed81a8068adf7509023b43dedce24ed606f8a01522b21313

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
