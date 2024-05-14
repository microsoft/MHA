FROM node:latest@sha256:5a254b77549c0da906b48dd4891a4ccbe5fd34aeb10e831b6ac8e35d3eae7499

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
