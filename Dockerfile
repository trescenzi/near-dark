FROM denoland/deno:1.30.3

EXPOSE 8000

COPY . .
RUN deno cache main.ts

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
