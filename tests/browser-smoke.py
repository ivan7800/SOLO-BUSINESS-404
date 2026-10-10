from playwright.sync_api import sync_playwright
import json
import os
import subprocess
import sys
import time
import socket
import urllib.request
import atexit
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
server=None
if os.environ.get('SOLO_BASE_URL'):
 BASE=os.environ['SOLO_BASE_URL'].rstrip('/')+'/'
else:
 with socket.socket() as s:
  s.bind(('127.0.0.1',0)); port=s.getsockname()[1]
 BASE=f'http://127.0.0.1:{port}/'
 server=subprocess.Popen([sys.executable,'-m','http.server',str(port),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 atexit.register(lambda: (server.terminate() if server.poll() is None else None))
 for _ in range(40):
  try:
   urllib.request.urlopen(BASE,timeout=0.3).close();break
  except Exception:time.sleep(0.1)
 else:raise RuntimeError('No se pudo iniciar el servidor local de pruebas')
CHROMIUM=os.environ.get('SOLO_CHROMIUM_PATH')
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, **({'executable_path':CHROMIUM} if CHROMIUM else {}))
 for viewport in [{'width':1440,'height':900},{'width':390,'height':844}]:
  page=browser.new_page(viewport=viewport)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE,wait_until='domcontentloaded')
  page.wait_for_timeout(300)
  assert page.locator('h1').count()==1
  for path in ['dashboard','clients','quotes','jobs','invoices','expenses','payments','reports','agenda','settings']:
   page.goto(BASE+'#/'+path,wait_until='domcontentloaded')
   page.wait_for_timeout(100)
   assert page.locator('h1').count()==1, path
   results.append(f'{viewport["width"]}: {path} OK')
  page.goto(BASE+'#/dashboard')
  page.locator('[data-action="quick-add"]').click()
  assert page.locator('#modal-host').count()==1
  page.locator('[data-action="new-client"]').click()
  assert page.locator('#entity-form').count()==1
  page.locator('#entity-form [name="name"]').fill('Prueba RC')
  page.locator('#entity-form [name="email"]').fill('qa@example.com')
  page.locator('#entity-form button[type="submit"]').click()
  page.wait_for_timeout(150)
  page.goto(BASE+'#/clients')
  assert page.get_by_text('Prueba RC').count()>0
  results.append(f'{viewport["width"]}: alta cliente OK')
  assert not errors, errors
  page.close()
 browser.close()
report={'passed':len(results),'details':results,'base_url':BASE}
Path(os.environ.get('SOLO_QA_REPORT','QA-NAVEGADOR.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
