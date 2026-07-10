FROM node:latest@sha256:926d6cafec97f338577041890465522f70fe74aa6fe4b021a4fd7f87a5996b25

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
