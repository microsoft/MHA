FROM node:latest@sha256:ab9ada02d0430fa5965401beec32042d64bddbb3ff3aaf2b2263abddf77eb18a

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
