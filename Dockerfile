FROM node:latest@sha256:2f73096d856b0b9d6fa43002edb619f1527f939bab870eab6c909f633bcf56e9

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
