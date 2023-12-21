FROM node:latest@sha256:73a9c498369c6e6f864359979c8f4895f28323c07411605e6c870d696a0143fa

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present