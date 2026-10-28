do { ^docker rm -f auth-swagger } | complete | ignore
^docker run --rm -d --name auth-swagger --cpus 0.10 --memory 64m --memory-swap 64m -p 13002:8080 -e SWAGGER_JSON=/docs/swagger.json -v $'($env.PWD)/docs:/docs:ro' swaggerapi/swagger-ui:v5.32.6
