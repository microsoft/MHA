FROM node:latest@sha256:f73cc32c7285fba333cc4fbe00d5ff8babf7ebfa6a2557ab22919bcfdff05f0e

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
