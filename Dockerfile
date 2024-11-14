FROM node:latest@sha256:db2ab3844812aac5e7822dd3c8d0112c9561e189818e3aae02805f98616e7f52

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
