#!/usr/bin/env python3
"""As versões web das imagens do site da MD Decoração de Interiores.

Lê:
  media/fotos/*.jpg        as fotografias (cada uma tem de estar em content/fotos.json, com a descrição)
  media/videos/*.jpg       a imagem de espera (poster) de cada vídeo
  media/marca/emblema.png  o emblema redondo do logótipo, tal como o Manuel o usa (sem redesenhar)
  media/marca/dourado.png  o mesmo desenho só em dourado, com o fundo tirado (para fundos escuros)
  media/marca/monograma.png  o «MD» com a estrela (ícone pequeno)

Escreve em .cache/imagens/ (o nome de cada ficheiro leva um resumo do original: só se refaz o que muda) e o manifesto
.cache/imagens/manifesto.json, que o scripts/build.mjs lê para escrever os <picture> e copiar para _site/ só o que
as páginas usam.

    python3 scripts/imagens.py
"""
import glob, hashlib, json, os, sys
try:
    from PIL import Image, ImageOps, features
except ImportError:  # o Python do Mac tem a Pillow na pasta do utilizador
    sys.path.append(os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages'))
    from PIL import Image, ImageOps, features

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FOTOS = os.path.join(RAIZ, 'media', 'fotos')
VIDEOS = os.path.join(RAIZ, 'media', 'videos')
MARCA = os.path.join(RAIZ, 'media', 'marca')
INDICE = os.path.join(RAIZ, 'content', 'fotos.json')
CACHE = os.path.join(RAIZ, '.cache', 'imagens')

LARGURAS = [360, 540, 720, 960, 1280]
FORMATOS = ('avif', 'webp') if features.check('avif') else ('webp',)
QUALIDADE = {'avif': 50, 'webp': 78}
PARTILHA = (1200, 630)
FUNDO = (246, 242, 235)      # --linho do site: o fundo do cartão de partilha da marca
VERSAO = f'v1-{LARGURAS}-{QUALIDADE}-{PARTILHA}'


def resumo(caminho, extra=''):
    h = hashlib.sha256((VERSAO + extra).encode())
    with open(caminho, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()[:10]


def guardar(im, destino, formato, **kw):
    if os.path.exists(destino):
        return
    tmp = destino + '.tmp'
    if formato == 'avif':
        im.save(tmp, 'AVIF', quality=QUALIDADE['avif'], speed=6)
    elif formato == 'webp':
        im.save(tmp, 'WEBP', quality=QUALIDADE['webp'], method=6)
    elif formato == 'png':
        im.save(tmp, 'PNG', optimize=True)
    else:
        im.save(tmp, 'JPEG', quality=kw.get('q', 82), optimize=True, progressive=True,
                subsampling=kw.get('subsampling', 2))
    os.replace(tmp, destino)


def versoes(nome, origem):
    """AVIF + WebP nas larguras que a imagem aguenta (nunca se aumenta), um JPEG de recurso e o cartão de partilha."""
    h = resumo(origem)
    with Image.open(origem) as cab:
        W, H = cab.size
    larguras = sorted(set([w for w in LARGURAS if w < W] + [min(W, LARGURAS[-1])]))
    jw = min(W, 960)
    feito = [os.path.join(CACHE, f'{nome}-{h}-{w}.{fmt}') for w in larguras for fmt in FORMATOS]
    feito += [os.path.join(CACHE, f'{nome}-{h}-{jw}.jpg'), os.path.join(CACHE, f'{nome}-{h}-partilha.jpg')]
    info = {'w': W, 'h': H, 'resumo': h, 'larguras': larguras, 'formatos': list(FORMATOS), 'jpg': jw}
    if all(os.path.exists(f) for f in feito):
        return info
    im = ImageOps.exif_transpose(Image.open(origem)).convert('RGB')
    for w in larguras:
        r = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        for fmt in FORMATOS:
            guardar(r, os.path.join(CACHE, f'{nome}-{h}-{w}.{fmt}'), fmt)
    guardar(im if jw == W else im.resize((jw, round(H * jw / W)), Image.LANCZOS),
            os.path.join(CACHE, f'{nome}-{h}-{jw}.jpg'), 'jpg')
    # cartão de partilha 1200×630, recortado à volta do foco (as fotografias são quase todas ao alto)
    pw, ph = PARTILHA
    esc = max(pw / W, ph / H)
    r = im.resize((round(W * esc), round(H * esc)), Image.LANCZOS)
    x = (r.width - pw) // 2
    y = max(0, min(r.height - ph, round(r.height * 0.5 - ph / 2)))
    guardar(r.crop((x, y, x + pw, y + ph)), os.path.join(CACHE, f'{nome}-{h}-partilha.jpg'), 'jpg')
    return info


def marca():
    """O emblema e o desenho dourado a 1×/2×/3× dos tamanhos em que aparecem, os ícones e o cartão de partilha."""
    out = {}
    for chave, ficheiro, alturas in (('emblema', 'emblema.png', (48, 64, 96, 128, 144, 192, 288, 384, 500)),
                                     ('dourado', 'dourado.png', (96, 160, 240, 320, 480, 500)),
                                     ('monograma', 'monograma.png', (32, 64, 96, 128, 210))):
        origem = os.path.join(MARCA, ficheiro)
        im = Image.open(origem).convert('RGBA')
        h = resumo(origem)
        item = {'w': im.width, 'h': im.height, 'resumo': h, 'alturas': []}
        for alt in alturas:
            if alt > im.height:
                continue
            w = round(im.width * alt / im.height)
            r = im if alt == im.height else im.resize((w, alt), Image.LANCZOS)
            guardar(r, os.path.join(CACHE, f'{chave}-{h}-{alt}.png'), 'png')
            guardar(r, os.path.join(CACHE, f'{chave}-{h}-{alt}.webp'), 'webp')
            item['alturas'].append(alt)
        out[chave] = item
    # ícones: o emblema inteiro (é redondo e escuro, como no Instagram), num quadrado do verde do logótipo
    emb = Image.open(os.path.join(MARCA, 'emblema.png')).convert('RGBA')
    he = out['emblema']['resumo']
    for lado in (32, 180, 192, 512):
        q = Image.new('RGBA', (lado, lado), (28, 32, 31, 255))
        r = emb.resize((lado, lado), Image.LANCZOS) if lado != emb.width else emb
        if lado == 32:  # a 32 px o anel e o texto em arco são ruído: o monograma dourado no verde
            mono = Image.open(os.path.join(MARCA, 'monograma.png')).convert('RGBA')
            mono.thumbnail((26, 26), Image.LANCZOS)
            q.alpha_composite(mono, ((lado - mono.width) // 2, (lado - mono.height) // 2))
        else:
            q.alpha_composite(r)
        guardar(q.convert('RGB'), os.path.join(CACHE, f'icone-{he}-{lado}.png'), 'png')
    out['icones'] = [32, 180, 192, 512]
    # cartão de partilha da marca: o emblema ao centro no fundo de linho do site, ao tamanho dele (nunca aumentado)
    hc = resumo(os.path.join(MARCA, 'emblema.png'), extra=f'cartao-{FUNDO}-{PARTILHA}')
    out['partilha'] = f'md-decoracao-{hc}-partilha.jpg'
    destino = os.path.join(CACHE, out['partilha'])
    if not os.path.exists(destino):
        cartao = Image.new('RGBA', PARTILHA, FUNDO + (255,))
        lado = min(emb.width, 440)
        r = emb if lado == emb.width else emb.resize((lado, lado), Image.LANCZOS)
        cartao.alpha_composite(r, ((PARTILHA[0] - lado) // 2, (PARTILHA[1] - lado) // 2))
        guardar(cartao.convert('RGB'), destino, 'jpg', q=92, subsampling=0)
    return out


def main():
    indice = json.load(open(INDICE, encoding='utf-8'))
    fotos = {os.path.splitext(os.path.basename(f))[0]: f for f in sorted(glob.glob(os.path.join(FOTOS, '*.jpg')))}
    sem_indice = sorted(set(fotos) - set(indice))
    sem_ficheiro = sorted(set(indice) - set(fotos))
    if sem_indice or sem_ficheiro:
        if sem_indice:
            print('Fotografias sem entrada em content/fotos.json:', ', '.join(sem_indice))
        if sem_ficheiro:
            print('Entradas de content/fotos.json sem fotografia:', ', '.join(sem_ficheiro))
        sys.exit(1)
    os.makedirs(CACHE, exist_ok=True)
    manifesto = {'fotos': {}, 'videos': {}, 'marca': None}
    for i, (nome, f) in enumerate(fotos.items(), 1):
        manifesto['fotos'][nome] = versoes(nome, f)
        if i % 25 == 0:
            print(f'  {i}/{len(fotos)}', flush=True)
    for f in sorted(glob.glob(os.path.join(VIDEOS, '*.jpg'))):
        nome = os.path.splitext(os.path.basename(f))[0]
        manifesto['videos'][nome] = versoes('video-' + nome, f)
    manifesto['marca'] = marca()
    with open(os.path.join(CACHE, 'manifesto.json'), 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=1)
    print(f"{len(manifesto['fotos'])} fotografias, {len(manifesto['videos'])} imagens de vídeo e a marca.")


if __name__ == '__main__':
    main()
