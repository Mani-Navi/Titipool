# ==========================================
# Stage 1: Build the application
# ==========================================
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk add --no-cache tzdata fontconfig freetype ttf-dejavu

ENV TZ=Asia/Tehran
ENV JAVA_OPTS="-XX:+UseG1GC \
               -XX:+UseStringDeduplication \
               -XX:MaxGCPauseMillis=100 \
               -XX:MaxRAMPercentage=75.0 \
               -XX:InitialRAMPercentage=35.0 \
               -XX:+ExitOnOutOfMemoryError \
               -Dfile.encoding=UTF-8 \
               -Djava.security.egd=file:/dev/./urandom"

RUN addgroup -S vttgroup && adduser -S vttuser -G vttgroup && \
    mkdir -p /app/uploads && \
    chown -R vttuser:vttgroup /app

USER vttuser

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]