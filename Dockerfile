FROM node:latest@sha256:64c46a664eccedec63941dab4027c178a36debe08a232d4f9d7da5aca91cff3d

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
