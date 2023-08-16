FROM node:latest@sha256:357eeb3d488c43abf941603ef5c473a3944f033e44583607be626434356e4677

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present