FROM node:latest@sha256:32ec50b65ac9572eda92baa6004a04dbbfc8021ea806fa62d37336183cad04e6

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present