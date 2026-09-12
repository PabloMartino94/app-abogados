import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  contarTexto, convertirTexto, eliminarDuplicados, extraerEmails, extraerFechas,
  compararTextos, type ModoConversion,
} from "@shared/tools/texto";
import { montoALetras, type Moneda } from "@shared/tools/montos";
import { Campo, CampoNumero, Resultado, mostrarFecha } from "./ui";

/** Botón de copiar con confirmación, porque casi todas estas herramientas terminan en un pegado. */
function BotonCopiar({ texto, testId }: { texto: string; testId?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl"
      onClick={copiar}
      disabled={!texto}
      data-testid={testId}
    >
      {copiado ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
      {copiado ? "Copiado" : "Copiar"}
    </Button>
  );
}

export function HerramientaMontoALetras() {
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("pesos");

  const resultado = useMemo(() => {
    const m = Number(monto);
    if (!monto.trim() || !isFinite(m)) return null;
    return montoALetras(m, moneda);
  }, [monto, moneda]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Para escribir importes en contratos y escritos, con centavos incluidos.
      </p>
      <CampoNumero etiqueta="Importe" valor={monto} onChange={setMonto} paso="0.01" testId="input-letras-monto" />
      <Campo etiqueta="Moneda">
        <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)}>
          <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-letras-moneda">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pesos">Pesos</SelectItem>
            <SelectItem value="dólares">Dólares</SelectItem>
            <SelectItem value="euros">Euros</SelectItem>
          </SelectContent>
        </Select>
      </Campo>

      {resultado && (
        <>
          <Resultado titulo="En letras" valor={<span className="text-base">{resultado.texto}</span>} testId="resultado-letras" />
          <Resultado
            titulo="Formato de contrato"
            valor={<span className="font-mono text-sm">{resultado.formatoLegal}</span>}
          />
          <div className="flex gap-2">
            <BotonCopiar texto={resultado.texto} testId="button-copiar-letras" />
            <BotonCopiar texto={resultado.formatoLegal} testId="button-copiar-legal" />
          </div>
        </>
      )}
    </div>
  );
}

export function HerramientaContador() {
  const [texto, setTexto] = useState("");
  const conteo = useMemo(() => contarTexto(texto), [texto]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Para verificar los límites de extensión de un escrito.
      </p>
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="min-h-40 rounded-2xl"
        placeholder="Pegá el texto acá…"
        data-testid="textarea-contador"
      />
      <div className="grid grid-cols-2 gap-2">
        <Resultado titulo="Palabras" valor={conteo.palabras.toLocaleString("es-AR")} testId="resultado-palabras" />
        <Resultado titulo="Caracteres" valor={conteo.caracteres.toLocaleString("es-AR")} />
        <Resultado titulo="Sin espacios" valor={conteo.caracteresSinEspacios.toLocaleString("es-AR")} />
        <Resultado titulo="Oraciones" valor={conteo.oraciones.toLocaleString("es-AR")} />
        <Resultado titulo="Párrafos" valor={conteo.parrafos.toLocaleString("es-AR")} />
        <Resultado titulo="Carillas" valor={conteo.paginasEstimadas} detalle="Estimadas a 2.400 caracteres." />
      </div>
    </div>
  );
}

export function HerramientaConversorTexto() {
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<ModoConversion>("mayusculas");

  const resultado = useMemo(() => convertirTexto(texto, modo), [texto, modo]);

  return (
    <div className="grid gap-3">
      <Campo etiqueta="Convertir a">
        <Select value={modo} onValueChange={(v) => setModo(v as ModoConversion)}>
          <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-conversor-modo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mayusculas">MAYÚSCULAS</SelectItem>
            <SelectItem value="minusculas">minúsculas</SelectItem>
            <SelectItem value="titulo">Título</SelectItem>
            <SelectItem value="oracion">Tipo oración</SelectItem>
          </SelectContent>
        </Select>
      </Campo>
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="min-h-28 rounded-2xl"
        placeholder="Pegá el texto acá…"
        data-testid="textarea-conversor"
      />
      {texto && (
        <>
          <Textarea
            value={resultado}
            readOnly
            className="min-h-28 rounded-2xl bg-white/60"
            data-testid="textarea-conversor-resultado"
          />
          <BotonCopiar texto={resultado} testId="button-copiar-conversor" />
        </>
      )}
    </div>
  );
}

export function HerramientaDuplicados() {
  const [texto, setTexto] = useState("");
  const [ignorarMayusculas, setIgnorarMayusculas] = useState(true);
  const [ignorarEspacios, setIgnorarEspacios] = useState(true);
  const [ordenar, setOrdenar] = useState(false);

  const resultado = useMemo(
    () => eliminarDuplicados(texto, { ignorarMayusculas, ignorarEspacios, ordenar }),
    [texto, ignorarMayusculas, ignorarEspacios, ordenar],
  );

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Una línea por elemento. Sirve para listados de expedientes, DNI o direcciones.
      </p>
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="min-h-32 rounded-2xl font-mono text-xs"
        placeholder="Pegá el listado acá…"
        data-testid="textarea-duplicados"
      />

      <div className="grid gap-2 rounded-2xl border bg-white/40 px-3 py-3">
        {[
          { label: "Ignorar mayúsculas", value: ignorarMayusculas, set: setIgnorarMayusculas, id: "switch-dup-mayusculas" },
          { label: "Ignorar espacios al principio y al final", value: ignorarEspacios, set: setIgnorarEspacios, id: "switch-dup-espacios" },
          { label: "Ordenar alfabéticamente", value: ordenar, set: setOrdenar, id: "switch-dup-ordenar" },
        ].map((opcion) => (
          <div key={opcion.id} className="flex items-center justify-between gap-3">
            <span className="text-xs">{opcion.label}</span>
            <Switch checked={opcion.value} onCheckedChange={opcion.set} data-testid={opcion.id} />
          </div>
        ))}
      </div>

      {texto.trim() && (
        <>
          <Resultado
            titulo="Resultado"
            valor={`${resultado.unicas} línea${resultado.unicas === 1 ? "" : "s"}`}
            detalle={`Se eliminaron ${resultado.eliminadas} de ${resultado.originales}.`}
            testId="resultado-duplicados"
          />
          <Textarea
            value={resultado.resultado}
            readOnly
            className="min-h-32 rounded-2xl bg-white/60 font-mono text-xs"
            data-testid="textarea-duplicados-resultado"
          />
          <BotonCopiar texto={resultado.resultado} testId="button-copiar-duplicados" />
        </>
      )}
    </div>
  );
}

export function HerramientaExtraerEmails() {
  const [texto, setTexto] = useState("");
  const emails = useMemo(() => extraerEmails(texto), [texto]);

  return (
    <div className="grid gap-3">
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="min-h-32 rounded-2xl"
        placeholder="Pegá el texto del que querés sacar los correos…"
        data-testid="textarea-emails"
      />
      {texto.trim() && (
        <>
          <Resultado
            titulo="Correos encontrados"
            valor={emails.length}
            testId="resultado-emails"
          />
          {emails.length > 0 && (
            <>
              <Textarea
                value={emails.join("\n")}
                readOnly
                className="min-h-24 rounded-2xl bg-white/60 font-mono text-xs"
                data-testid="textarea-emails-resultado"
              />
              <div className="flex gap-2">
                <BotonCopiar texto={emails.join("\n")} testId="button-copiar-emails" />
                <BotonCopiar texto={emails.join(", ")} testId="button-copiar-emails-coma" />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function HerramientaExtraerFechas() {
  const [texto, setTexto] = useState("");
  const fechas = useMemo(() => extraerFechas(texto), [texto]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Detecta 12/09/2026, 12-09-2026, 2026-09-12 y "12 de septiembre de 2026". Útil para armar la
        cronología de un expediente.
      </p>
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="min-h-32 rounded-2xl"
        placeholder="Pegá el relato o el escrito…"
        data-testid="textarea-extraer-fechas"
      />
      {texto.trim() && (
        <>
          <Resultado titulo="Fechas encontradas" valor={fechas.length} testId="resultado-extraer-fechas" />
          {fechas.length > 0 && (
            <div className="grid gap-1">
              {fechas.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border bg-white/50 px-2.5 py-1.5"
                  data-testid={`row-fecha-${i}`}
                >
                  <span className="text-xs font-semibold">
                    {f.iso ? mostrarFecha(f.iso) : "sin reconocer"}
                  </span>
                  <span className="text-xs text-muted-foreground">"{f.textoOriginal}"</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function HerramientaCompararTextos() {
  const [textoA, setTextoA] = useState("");
  const [textoB, setTextoB] = useState("");

  const diff = useMemo(() => {
    if (!textoA.trim() && !textoB.trim()) return null;
    return compararTextos(textoA, textoB);
  }, [textoA, textoB]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Compara línea por línea dos versiones de un escrito y marca qué cambió.
      </p>
      <Campo etiqueta="Versión original">
        <Textarea
          value={textoA}
          onChange={(e) => setTextoA(e.target.value)}
          className="min-h-28 rounded-2xl font-mono text-xs"
          data-testid="textarea-comparar-a"
        />
      </Campo>
      <Campo etiqueta="Versión nueva">
        <Textarea
          value={textoB}
          onChange={(e) => setTextoB(e.target.value)}
          className="min-h-28 rounded-2xl font-mono text-xs"
          data-testid="textarea-comparar-b"
        />
      </Campo>

      {diff && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Resultado titulo="Iguales" valor={diff.iguales} testId="resultado-comparar" />
            <Resultado titulo="Agregadas" valor={diff.agregadas} />
            <Resultado titulo="Quitadas" valor={diff.quitadas} />
          </div>
          <div className="grid gap-0.5 rounded-2xl border bg-white/60 px-2 py-2 font-mono text-xs">
            {diff.lineas.map((linea, i) => (
              <div
                key={i}
                className={
                  linea.tipo === "agregada"
                    ? "rounded bg-green-50 px-1.5 py-0.5 text-green-800"
                    : linea.tipo === "quitada"
                      ? "rounded bg-red-50 px-1.5 py-0.5 text-red-800 line-through"
                      : "px-1.5 py-0.5 text-muted-foreground"
                }
                data-testid={`row-diff-${i}`}
              >
                <span className="select-none opacity-60">
                  {linea.tipo === "agregada" ? "+ " : linea.tipo === "quitada" ? "- " : "  "}
                </span>
                {linea.texto || " "}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
