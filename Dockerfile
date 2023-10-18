FROM node:latest@sha256:98f80754df0cf581de86a2cbbf85692cccde41916b35a97a1c84b0a971b8d578

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present