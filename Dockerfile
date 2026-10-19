FROM node:latest@sha256:1b84b89ada025e3b14543cbb837ffaa1c1b5273b841c5b94dd1a8f9c1d8cf7fe

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
