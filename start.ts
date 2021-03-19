import * as esbuild from "esbuild";
import { fastify } from "fastify";

const server = fastify({ logger: true });

server.get("/", (request, reply) => {
  reply.type("text/html");
  reply.send(`
<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>WASMデバッグ</title>
  <script defer src="start.js"></script>
</head>

<body>
やあ. WASMのデバッグ場所だよ
</body>

</html>
`);
});

server.get("/start.js", (request, replay) => {
  replay.type("text/javascript");
  esbuild
    .build({
      write: false,
      entryPoints: ["./wasm/start.ts"],
      tsconfig: "./tsconfig.json",
      bundle: true,
    })
    .then((result) => {
      const file = result.outputFiles[0];
      if (file === undefined) {
        throw new Error("esbuild でファイルが出力されなかった");
      }
      replay.send(file.text);
    })
    .catch((e) => {
      server.log.error("esbuild error", e);
    });
});

server.listen(3000, (err, address) => {
  if (err) {
    throw err;
  }
  server.log.info(`server listening on ${address}`);
});
