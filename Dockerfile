FROM node:latest@sha256:b44cbfafe84144217b7502cde5d21958500781fb9b13eed74a47486db2277cd5

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
