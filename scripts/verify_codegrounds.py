"""Run every codeGround's solution against its own validationLogic.

The lesson data is TypeScript, so we pull the fields out with a small
brace-matching parser rather than a regex, then execute each block in a
fresh namespace exactly the way Pyodide will in the browser.
"""

import re
import sys
import pathlib

FILES = ['data/curriculum.ts', 'data/lessons-ml.ts']


def read_template(src, key, start):
    """Read `key: `...`` starting at or after `start`. Returns (value, end)."""
    m = re.search(rf"{key}:\s*`", src[start:])
    if not m:
        return None, start
    i = start + m.end()
    out = []
    while i < len(src):
        c = src[i]
        if c == '\\':
            nxt = src[i + 1]
            out.append({'n': '\n', 't': '\t', '`': '`', '\\': '\\', '$': '$'}.get(nxt, nxt))
            i += 2
            continue
        if c == '`':
            return ''.join(out), i + 1
        out.append(c)
        i += 1
    return None, start


def read_quoted(src, key, start):
    m = re.search(rf"{key}:\s*'((?:[^'\\]|\\.)*)'", src[start:])
    if not m:
        return None, start
    val = m.group(1).replace("\\'", "'").replace('\\\\', '\\')
    return val, start + m.end()


def blocks(src):
    """Yield one dict per codeGround found in the source."""
    for cg in re.finditer(r'(?:codeGround|override):\s*\{', src):
        start = cg.end()
        # Bound the search at the next codeGround so fields don't bleed across.
        nxt = min([i for i in (src.find('codeGround:', start), src.find('override:', start)) if i != -1] or [-1])
        end = nxt if nxt != -1 else len(src)
        chunk = src[start:end]

        setup, _ = read_template(chunk, 'setupCode', 0)
        solution, _ = read_template(chunk, 'solutionCode', 0)

        checks = []
        for cm in re.finditer(r"expression:\s*'((?:[^'\\]|\\.)*)'", chunk):
            checks.append(cm.group(1).replace("\\'", "'").replace('\\\\', '\\'))

        ids = [m.group(1) for m in re.finditer(r"id:\s*'([^']+)',\s*\n\s*label:", chunk)]

        # Identify the lesson by the nearest preceding slug.
        head = src[:cg.start()]
        slugs = re.findall(r"(?:slug|id):\s*'([^']+)'", head)
        name = slugs[-1] if slugs else '?'

        yield {
            'lesson': name,
            'setup': setup or '',
            'solution': solution or '',
            'checks': checks,
            'ids': ids,
        }


def main():
    total = failed = 0

    for path in FILES:
        src = pathlib.Path(path).read_text()

        for b in blocks(src):
            total += 1
            ns = {}
            label = f"{b['lesson']:<22}"

            try:
                exec(b['setup'], ns)
                exec(b['solution'], ns)
            except Exception as e:
                print(f'  FAIL {label} solution raised: {type(e).__name__}: {e}')
                failed += 1
                continue

            bad = []
            for i, expr in enumerate(b['checks']):
                cid = b['ids'][i] if i < len(b['ids']) else str(i)
                try:
                    ok = bool(eval(expr, ns))
                except Exception as e:
                    bad.append(f'{cid} errored ({type(e).__name__}: {e})')
                    continue
                if not ok:
                    bad.append(f'{cid} returned False')

            if bad:
                failed += 1
                print(f'  FAIL {label} {len(b["checks"])} checks')
                for msg in bad:
                    print(f'        - {msg}')
            else:
                print(f'  ok   {label} {len(b["checks"])} checks pass')

    print(f'\n{total - failed}/{total} code grounds verified')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
