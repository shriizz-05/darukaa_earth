# Multi-stage: Maven Wrapper 3.9 + JDK 17 build, then JRE 17 runtime.
# Do not copy .env or other secrets (see .dockerignore).

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src

COPY mvnw pom.xml ./
COPY .mvn .mvn
# Windows checkouts may leave CRLF on mvnw; the wrapper is required by this image.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw \
    && ./mvnw -B -q -DskipTests dependency:go-offline || true

COPY src src
RUN ./mvnw -B -DskipTests package \
    && cp target/earth-0.0.1-SNAPSHOT.jar /src/app.jar

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /src/app.jar /app/app.jar

EXPOSE 8080
ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
