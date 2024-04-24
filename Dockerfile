FROM node:latest@sha256:bda531283f4bafd1cb41294493de89ae3c4cf55933da14710e46df970e77365e

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
