FROM public.ecr.aws/lambda/python:3.9 AS builder

WORKDIR /app

RUN yum install -y zip

COPY requirements.txt .

RUN mkdir -p layer_common_lib/python

RUN pip install -r requirements.txt -t layer_common_lib/python

RUN cd layer_common_lib && zip -r ../layer_common_lib.zip .

FROM busybox AS final
COPY --from=builder /app/layer_common_lib.zip /layer_common_lib.zip
CMD ["cat", "/layer_common_lib.zip"]
