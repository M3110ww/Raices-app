# ---------- Etapa 1: compilar ----------
FROM maven:3.9-eclipse-temurin-21 AS construccion
WORKDIR /app

# Primero solo el pom: así la capa de dependencias se reutiliza entre despliegues.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B package -DskipTests

# ---------- Etapa 2: ejecutar ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Sin privilegios: el proceso no necesita ser root.
RUN useradd --create-home --shell /bin/false raices
USER raices

COPY --from=construccion /app/target/*.jar app.jar

EXPOSE 8080

# El plan gratuito de Render tiene poca memoria: se le deja usar hasta el 75 %.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
