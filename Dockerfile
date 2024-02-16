FROM node:latest@sha256:1861f135f2d61d146e9d3547df0c2275fe6a43c3647075d16d909ba0f5690771

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present