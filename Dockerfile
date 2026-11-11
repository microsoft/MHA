FROM node:latest@sha256:438603bbb5cda404b9416f0b5c8026f61501ab911760d861ec28c36b5d675725

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
