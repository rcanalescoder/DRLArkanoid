#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Normaliza ortografia del libro v3 (capitulos HTML), sin tocar HTML estructural.
   1) Entidades de acento -> UTF-8 (NO toca &lt; &gt; &amp; &nbsp; &quot;).
   2) Lista blanca de palabras SIN homografo (seguras) -> acentuadas, respetando mayusculas.
   3) Patrones interrogativos seguros (¿que -> ¿que, por que -> por que).
   Uso: python fix_orto.py <fichero.html>  (edita in situ; imprime un resumen)."""
import sys, re, io

# ---- 1) Entidades de acento/puntuacion -> caracter (allowlist; estructurales fuera) ----
ENT = {
    'aacute':'á','eacute':'é','iacute':'í','oacute':'ó','uacute':'ú','ntilde':'ñ','uuml':'ü',
    'Aacute':'Á','Eacute':'É','Iacute':'Í','Oacute':'Ó','Uacute':'Ú','Ntilde':'Ñ','Uuml':'Ü',
    'iexcl':'¡','iquest':'¿','mdash':'—','ndash':'–','hellip':'…','laquo':'«','raquo':'»',
    'rsquo':'’','lsquo':'‘','ldquo':'“','rdquo':'”','deg':'°','middot':'·','times':'×',
    'rarr':'→','larr':'←','le':'≤','ge':'≥','ne':'≠','minus':'−',
}
NUM = {225:'á',233:'é',237:'í',243:'ó',250:'ú',241:'ñ',252:'ü',193:'Á',201:'É',205:'Í',
       211:'Ó',218:'Ú',209:'Ñ',220:'Ü',161:'¡',191:'¿',8212:'—',8211:'–',8230:'…',171:'«',187:'»'}

# ---- 2) Lista blanca: base SIN acento -> acentuada. Solo palabras sin homografo de uso. ----
PAIRS = {
 # -cion / -sion / -on (singular; los plurales -ciones ya van sin tilde)
 'accion':'acción','prediccion':'predicción','direccion':'dirección','funcion':'función',
 'ecuacion':'ecuación','formulacion':'formulación','observacion':'observación','intuicion':'intuición',
 'evaluacion':'evaluación','generalizacion':'generalización','exploracion':'exploración',
 'explotacion':'explotación','implementacion':'implementación','version':'versión','decision':'decisión',
 'dispersion':'dispersión','expresion':'expresión','presion':'presión','conclusion':'conclusión',
 'condicion':'condición','posicion':'posición','transicion':'transición','definicion':'definición',
 'distribucion':'distribución','aproximacion':'aproximación','retropropagacion':'retropropagación',
 'regularizacion':'regularización','modelizacion':'modelización','atencion':'atención','relacion':'relación',
 'situacion':'situación','combinacion':'combinación','notacion':'notación','repeticion':'repetición',
 'computacion':'computación','optimizacion':'optimización','actualizacion':'actualización',
 'validacion':'validación','seccion':'sección','opcion':'opción','proporcion':'proporción',
 'correlacion':'correlación','simulacion':'simulación','interpretacion':'interpretación',
 'representacion':'representación','normalizacion':'normalización','inicializacion':'inicialización',
 'configuracion':'configuración','informacion':'información','comprension':'comprensión','vision':'visión',
 'conexion':'conexión','precision':'precisión','revision':'revisión','division':'división',
 'aceleracion':'aceleración','reduccion':'reducción','produccion':'producción','introduccion':'introducción',
 'corazon':'corazón','razon':'razón','region':'región','monton':'montón','limitacion':'limitación',
 'ocupacion':'ocupación','estimacion':'estimación','convolucion':'convolución','activacion':'activación',
 'leccion':'lección','solucion':'solución','ablacion':'ablación','intencion':'intención','fraccion':'fracción',
 'descripcion':'descripción','tentacion':'tentación','tension':'tensión','supervision':'supervisión',
 'reaccion':'reacción','nocion':'noción','medicion':'medición','investigacion':'investigación',
 'explicacion':'explicación','eleccion':'elección','ejecucion':'ejecución','distincion':'distinción',
 'comparacion':'comparación','asignacion':'asignación','sobreestimacion':'sobreestimación',
 'separacion':'separación','precaucion':'precaución','planificacion':'planificación','orientacion':'orientación',
 'operacion':'operación','interaccion':'interacción','indecision':'indecisión','ilusion':'ilusión',
 'excepcion':'excepción','especulacion':'especulación','diferenciacion':'diferenciación','deteccion':'detección',
 'destruccion':'destrucción','descomposicion':'descomposición','depuracion':'depuración','correccion':'corrección',
 'continuacion':'continuación','confusion':'confusión','concentracion':'concentración','concatenacion':'concatenación',
 'acumulacion':'acumulación','aclaracion':'aclaración','abstraccion':'abstracción','resolucion':'resolución',
 'seleccion':'selección','conviccion':'convicción','guia':'guía','guias':'guías','via':'vía','vias':'vías',
 'conseguia':'conseguía','confia':'confía','energia':'energía',
 # -ia (imperfecto/condicional y nombres; sin homografo)
 'habia':'había','tenia':'tenía','podia':'podía','queria':'quería','debia':'debía','deberia':'debería',
 'podria':'podría','haria':'haría','tendria':'tendría','iria':'iría','dejaria':'dejaría','arruinaria':'arruinaría',
 'veia':'veía','creia':'creía','decia':'decía','traia':'traía','caia':'caía','leia':'leía','referia':'refería',
 'parecia':'parecía','aparecia':'aparecía','ocurria':'ocurría','existia':'existía','consistia':'consistía',
 'servia':'servía','salia':'salía','subia':'subía','valia':'valía','venia':'venía','seguia':'seguía',
 'teoria':'teoría','energia':'energía','garantia':'garantía','geometria':'geometría','simetria':'simetría',
 'categoria':'categoría','economia':'economía','bateria':'batería','dia':'día','dias':'días',
 'todavia':'todavía','policia':'policía',
 # adverbios y conectores sin homografo
 'tambien':'también','asi':'así','aqui':'aquí','ahi':'ahí','alli':'allí','alla':'allá','aca':'acá',
 'despues':'después','atras':'atrás','detras':'detrás','demas':'demás','jamas':'jamás','quizas':'quizás',
 'quiza':'quizá','ademas':'además','interes':'interés','traves':'través','asimismo':'asimismo',
 'ningun':'ningún','algun':'algún','segun':'según','mas':'más',
 # adjetivos/sustantivos esdrujulos/llanos sin homografo
 'numero':'número','numeros':'números','metrica':'métrica','metricas':'métricas','metodo':'método',
 'metodos':'métodos','tecnico':'técnico','tecnica':'técnica','tecnicos':'técnicos','tecnicas':'técnicas',
 'tecnicamente':'técnicamente','politica':'política','politicas':'políticas','matematica':'matemática',
 'matematicas':'matemáticas','matematico':'matemático','parametro':'parámetro','parametros':'parámetros',
 'maquina':'máquina','maquinas':'máquinas','pagina':'página','paginas':'páginas','rapido':'rápido',
 'rapida':'rápida','rapidos':'rápidos','rapidas':'rápidas','rapidamente':'rápidamente','facil':'fácil',
 'faciles':'fáciles','facilmente':'fácilmente','dificil':'difícil','dificiles':'difíciles','util':'útil',
 'utiles':'útiles','debil':'débil','movil':'móvil','moviles':'móviles','ultimo':'último','ultima':'última',
 'ultimos':'últimos','ultimas':'últimas','proximo':'próximo','proxima':'próxima','maximo':'máximo',
 'maxima':'máxima','maximos':'máximos','maximas':'máximas','minimo':'mínimo','minima':'mínima',
 'minimos':'mínimos','minimas':'mínimas','optimo':'óptimo','optima':'óptima','unico':'único','unica':'única',
 'unicos':'únicos','unicas':'únicas','unicamente':'únicamente','tipico':'típico','tipica':'típica',
 'clasico':'clásico','clasica':'clásica','automatico':'automático','automatica':'automática',
 'automaticamente':'automáticamente','estatico':'estático','estatica':'estática','dinamica':'dinámica',
 'dinamico':'dinámico','logica':'lógica','logico':'lógico','fisica':'física','fisico':'físico',
 'basico':'básico','basica':'básica','basicamente':'básicamente','practicamente':'prácticamente',
 'analisis':'análisis','sintesis':'síntesis','hipotesis':'hipótesis','enfasis':'énfasis','exito':'éxito',
 'exitos':'éxitos','oraculo':'oráculo','epoca':'época','epocas':'épocas','indice':'índice','indices':'índices',
 'limite':'límite','limites':'límites','caracter':'carácter','estandar':'estándar','cinematico':'cinemático',
 'cinematicos':'cinemáticos','cinematica':'cinemática','estocastica':'estocástica','estocastico':'estocástico',
 'aleatorio':'aleatorio','heuristica':'heurística','asintotico':'asintótico',
 # eñes
 'ano':'año','anos':'años','nino':'niño','ninos':'niños','senal':'señal','senales':'señales',
 'senala':'señala','senalan':'señalan','senalar':'señalar','diseno':'diseño','disenar':'diseñar',
 'disena':'diseña','pequeno':'pequeño','pequena':'pequeña','pequenos':'pequeños','pequenas':'pequeñas',
 'tamano':'tamaño','tamanos':'tamaños','ensenar':'enseñar','ensena':'enseña','companero':'compañero',
 'companeros':'compañeros','espanol':'español','espanola':'española','extrano':'extraño','extrana':'extraña',
 'dano':'daño','sueno':'sueño','manana':'mañana','engano':'engaño','enganar':'engañar','sueno':'sueño',
 # etiquetas de caja y rotulos
 'comun':'común','coreografia':'coreografía','capitulo':'capítulo','capitulos':'capítulos',
 'formula':'fórmula','formulas':'fórmulas','traduccion':'traducción','autocomprobacion':'autocomprobación',
 'quedate':'quédate','perdida':'pérdida','perdidas':'pérdidas',
}

AMBIG = {'que','el','tu','mi','se','si','de','te','esta','este','solo','aun','como',
         'donde','cuando','cuanto','cual','quien','media','seria','hacia','sabia','practica',
         'continua','evalua','actua','valido','termino','numero_'}  # documentadas: NO tocar

def restore_case(src, acc):
    if src.isupper(): return acc.upper()
    if src[0].isupper(): return acc[0].upper()+acc[1:]
    return acc

def main():
    path = sys.argv[1]
    t = io.open(path, encoding='utf-8').read()
    orig = t
    # 0) PROTEGER rutas: enmascara src="..." y href="..." para no acentuar nombres de fichero
    _masks = []
    def _mask(m): _masks.append(m.group(0)); return '\x00%d\x00' % (len(_masks)-1)
    t = re.sub(r'(?:src|href)="[^"]*"', _mask, t)
    # 1) entidades
    n_ent = 0
    def ent_named(m):
        nonlocal n_ent
        v = ENT.get(m.group(1))
        if v is None: return m.group(0)
        n_ent += 1; return v
    t = re.sub(r'&([A-Za-z]+);', ent_named, t)
    def ent_num(m):
        nonlocal n_ent
        v = NUM.get(int(m.group(1)))
        if v is None: return m.group(0)
        n_ent += 1; return v
    t = re.sub(r'&#(\d+);', ent_num, t)
    # 2) lista blanca
    n_words = 0
    for base, acc in PAIRS.items():
        if base in AMBIG: continue
        pat = re.compile(r'\b'+re.escape(base)+r'\b', re.IGNORECASE)
        def repl(m):
            nonlocal n_words; n_words += 1; return restore_case(m.group(0), acc)
        t = pat.sub(repl, t)
    # 3) patrones interrogativos seguros
    n_q = 0
    for pat, rep in [
        (r'¿([Pp])or que\b', r'¿\1or qué'), (r'\b([Pp])or que\b(?=[^.]*\?)', r'\1or qué'),
        (r'¿([Qq])ue\b', r'¿\1ué'), (r'¿([Cc])omo\b', r'¿\1ómo'), (r'¿([Dd])onde\b', r'¿\1ónde'),
        (r'¿([Cc])uando\b', r'¿\1uándo'), (r'¿([Cc])uanto', r'¿\1uánto'), (r'¿([Cc])ual\b', r'¿\1uál'),
        (r'¿([Qq])uien\b', r'¿\1uién'),
    ]:
        t, k = re.subn(pat, rep, t); n_q += k
    # 4) titulares interrogativos (reemplazo exacto, idempotente)
    HEAD = {
      '<h2>Como leer esta guía</h2>':'<h2>Cómo leer esta guía</h2>',
      '>De que va el laboratorio<':'>De qué va el laboratorio<',
      '>Por que vale la pena el viaje<':'>Por qué vale la pena el viaje<',
      '>Como se ve esto en nuestro Arkanoid<':'>Cómo se ve esto en nuestro Arkanoid<',
      '>Por que el 56% era un espejismo: supervivencia degenerada<':'>Por qué el 56% era un espejismo: supervivencia degenerada<',
      '>Por que el reloj fijo agravaba la trampa<':'>Por qué el reloj fijo agravaba la trampa<',
      '>Que no demuestra esta figura<':'>Qué no demuestra esta figura<',
      '>Como recupera Markov la versión con visión<':'>Cómo recupera Markov la versión con visión<',
      '>Como se actualiza la red objetivo: soft update de Polyak<':'>Cómo se actualiza la red objetivo: soft update de Polyak<',
      '>Quien las usa y quien no<':'>Quién las usa y quién no<',
      '>Por que la matriz 8x10 no puede entrar como una lista plana<':'>Por qué la matriz 8x10 no puede entrar como una lista plana<',
      '>Que es una convolución<':'>Qué es una convolución<',
    }
    n_head = 0
    for a, b in HEAD.items():
        if a in t: t = t.replace(a, b); n_head += 1
    # 5) REPARAR nombres de clase CSS: 'formula' y 'limite' van SIN tilde dentro de class="..."
    #    (el acentuado de la prosa NO debe tocar los selectores CSS .caja-formula/.formula/.caja-limite)
    n_cls = len(re.findall(r'class="[^"]*(?:fórmula|límite)[^"]*"', t))
    t = re.sub(r'class="([^"]*)"',
               lambda m: 'class="' + m.group(1).replace('fórmula','formula').replace('límite','limite') + '"', t)
    # 6) restaurar rutas protegidas
    for i, a in enumerate(_masks): t = t.replace('\x00%d\x00' % i, a)
    io.open(path, 'w', encoding='utf-8').write(t)
    print(f'{path}: entidades={n_ent}, palabras={n_words}, interrog={n_q}, titulares={n_head}, '
          f'clases_reparadas={n_cls}, delta={len(t)-len(orig)}')

if __name__ == '__main__':
    main()
