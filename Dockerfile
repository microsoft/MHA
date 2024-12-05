FROM node:latest@sha256:ac6abe7d72fe2a535b331d862bf01e064abfd65c7b085c3ca6a51869014474a0

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
