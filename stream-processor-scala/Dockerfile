FROM sbtscala/scala-sbt:eclipse-temurin-21_1.9.9_3.4.1 AS builder

WORKDIR /app
COPY . .
RUN sbt assembly || (sbt compile && sbt stage)

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 8090
ENTRYPOINT ["sh", "-c", "if [ -f target/scala-3.4.1/stream-processor-assembly-*.jar ]; then java -jar target/scala-3.4.1/stream-processor-assembly-*.jar; else java -cp $(find target -name '*.jar' | tr '\\n' ':') com.media.stream.Main; fi"]
