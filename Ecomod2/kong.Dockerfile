FROM kong:latest
# Corregimos la ruta: el contexto es la raíz, por lo que buscamos dentro de Ecomod2/
COPY Ecomod2/kong.yml /usr/local/kong/declarative/kong.yml
USER root
RUN chmod 644 /usr/local/kong/declarative/kong.yml
USER kong
