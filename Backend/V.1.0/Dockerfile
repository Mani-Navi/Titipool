# ==========================================
# Stage 1: Build the application
# ==========================================
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# کپی فایل وابستگی‌ها جهت کش شدن لایه‌های داکر
COPY pom.xml .
RUN mvn dependency:go-offline -B

# کپی سورس کد و بیلد بدون اجرای تست‌های لوکال
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# نصب پیش‌نیازهای ضروری پردازش گرافیکی ImageIO / Thumbnailator و مدیریت منطقه زمانی در آلپاین
RUN apk add --no-cache tzdata fontconfig freetype ttf-dejavu

# تنظیم متغیرهای سیستمی و پرفورمنس حافظه JVM
ENV TZ=Asia/Tehran
ENV JAVA_OPTS="-XX:+UseG1GC \
               -XX:MaxRAMPercentage=75.0 \
               -XX:InitialRAMPercentage=50.0 \
               -XX:+ExitOnOutOfMemoryError \
               -Dfile.encoding=UTF-8 \
               -Djava.security.egd=file:/dev/./urandom"

# ساخت کاربر غیر روت برای امنیت کانتینر و اعطای دسترسی به پوشه آپلودها
RUN addgroup -S vttgroup && adduser -S vttuser -G vttgroup && \
    mkdir -p /app/uploads && \
    chown -R vttuser:vttgroup /app

USER vttuser

# کپی آرتیفکت بیلد شده از مرحله قبل
COPY --from=builder /app/target/*.jar app.jar

# پورت اپلیکیشن (توسط پلتفرم‌هایی مانند Railway به‌صورت داینامیک نگاشت می‌شود)
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]