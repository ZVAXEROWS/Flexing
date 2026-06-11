ThisBuild / scalaVersion := "3.4.1"
ThisBuild / version      := "0.1.0-SNAPSHOT"
ThisBuild / organization := "com.media"

lazy val root = (project in file("."))
  .settings(
    name := "stream-processor",
    libraryDependencies ++= Seq(
      // Pekko (Apache-licensed Akka fork)
      "org.apache.pekko" %% "pekko-stream"            % "1.0.2",
      "org.apache.pekko" %% "pekko-actor-typed"        % "1.0.2",
      "org.apache.pekko" %% "pekko-http"               % "1.0.1",
      // Alpakka Kafka
      "org.apache.pekko" %% "pekko-connectors-kafka"   % "1.0.0",
      // gRPC (ScalaPB)
      "io.grpc"           % "grpc-netty"               % "1.62.2",
      "com.thesamet.scalapb" %% "scalapb-runtime-grpc" % scalapb.compiler.Version.scalapbVersion,
      // JSON
      "io.circe"         %% "circe-generic"             % "0.14.7",
      "io.circe"         %% "circe-parser"              % "0.14.7",
      // Logging
      "ch.qos.logback"    % "logback-classic"           % "1.5.6",
      // Test
      "org.apache.pekko" %% "pekko-stream-testkit"     % "1.0.2" % Test,
      "org.scalatest"    %% "scalatest"                 % "3.2.18" % Test,
    ),
    // ScalaPB protobuf codegen
    Compile / PB.targets := Seq(
      scalapb.gen() -> (Compile / sourceManaged).value / "scalapb"
    ),
    Compile / PB.protoSources := Seq(
      (baseDirectory.value / ".." / "infra" / "proto").getCanonicalFile
    ),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case x                             => MergeStrategy.first
    }
  )
