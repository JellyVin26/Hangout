import http.server, socketserver, functools, sys
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory='dist')
class Threaded(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
with Threaded(('127.0.0.1', 4174), handler) as httpd:
    print('serving on 4174')
    httpd.serve_forever()
