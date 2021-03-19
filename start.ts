import { fastify } from "fastify";
import * as esbuild from "esbuild";

const server = fastify({ logger: true });

server.get("/", (request, reply) => {
  reply.type("text/html");
  reply.send(`
<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>WASMデバッグ</title>
  <script defer src="main.js"></script>
</head>

<body>
やあ. WASMのデバッグ場所だよ
</body>

</html>
`);
});

server.get("/main.js", (request, replay) => {
  replay.type("text/javascript");
  esbuild
    .build({
      write: false,
      entryPoints: ["./wasm/main.ts"],
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
  if (err) throw err;
  server.log.info(`server listening on ${address}`);
});
