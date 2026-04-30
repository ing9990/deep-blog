FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache wget
WORKDIR /app
ARG JAR_FILE=build/libs/notification-server-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
