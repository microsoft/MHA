FROM node:latest@sha256:84bb4077fd52933a935e7057ba9991e7cb18487b0ba444835dd44975aa94b7b2

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present