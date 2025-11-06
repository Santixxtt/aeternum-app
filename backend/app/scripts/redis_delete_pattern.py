"""
Script para eliminar claves en Redis por patrón.

Uso: python redis_delete_pattern.py

Configura host/port/password/pattern según tu entorno.
"""
import ssl
from redis import Redis
import sys

HOST = "crossover.proxy.rlwy.net"
PORT = 58201
PASSWORD = "yNnOdmFoFqSiobQgnVjOHccXRbGYWoSQ"
PATTERN = "wishlist:*"  # cambia si tu patrón es distinto

def main():
    # Intentamos varias combinaciones (TLS on/off) para diagnosticar timeouts
    ssl_options = [True, False]
    last_exc = None

    for use_ssl in ssl_options:
        try:
            print(f"Intentando conectar a {HOST}:{PORT} con ssl={use_ssl} ...")
            r = Redis(
                host=HOST,
                port=PORT,
                password=PASSWORD,
                ssl=use_ssl,
                ssl_cert_reqs=(ssl.CERT_NONE if use_ssl else None),
                decode_responses=True,
                socket_timeout=10,
            )

            ok = r.ping()
            print(f"PING -> {ok} (ssl={use_ssl})")

            before = r.dbsize()
            print(f"DBSIZE antes: {before}")

            count = 0
            for key in r.scan_iter(match=PATTERN, count=1000):
                r.delete(key)
                count += 1

            after = r.dbsize()
            print(f"Eliminadas {count} claves con patrón '{PATTERN}' (ssl={use_ssl})")
            print(f"DBSIZE después: {after}")
            return

        except Exception as e:
            print(f"Fallo con ssl={use_ssl}: {e}")
            last_exc = e

    print("No fue posible conectar con las opciones probadas. Último error:", last_exc)
    sys.exit(1)

if __name__ == '__main__':
    main()