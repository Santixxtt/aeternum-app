# scripts/redis_flushdb.py
from redis import Redis
import ssl

r = Redis(
    host="crossover.proxy.rlwy.net",
    port=58201,
    password="yNnOdmFoFqSiobQgnVjOHccXRbGYWoSQ",
    ssl=True,             # fuerza TLS
    ssl_cert_reqs=None,   # si hay problemas con certificados
)

print("PING ->", r.ping())
print("DBSIZE ->", r.dbsize())
r.flushdb()
print("FLUSHDB executed")