FROM kong:latest
COPY kong.yml /usr/local/kong/declarative/kong.yml
USER root
RUN chmod 644 /usr/local/kong/declarative/kong.yml
USER kong
