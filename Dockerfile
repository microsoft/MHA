FROM node:latest@sha256:64f5c0619b62db2dfdd13dfa1b8c3361dcc95ec4bcbbb82b63146e9efa5f1e7e

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
