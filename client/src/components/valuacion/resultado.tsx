import { formatearPesos } from "@shared/tools/montos";
import type { ResultadoValuacion, Tripleta } from "@shared/tools/valuacion";
import { Aviso } from "@/components/herramientas/ui";

function FilaCadena({
  paso,
  titulo,
  explicacion,
  valores,
  destacado,
  testId,
}: {
  paso: number;
  titulo: string;
  explicacion: string;
  valores: Tripleta;
  destacado?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-3 ${destacado ? "bg-white/80" : "bg-white/45"}`}
      data-testid={testId}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{paso}</span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{titulo}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{explicacion}</div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          { etiqueta: "Mínimo", valor: valores.min },
          { etiqueta: "Pretendido", valor: valores.pretendido },
          { etiqueta: "Máximo", valor: valores.max },
        ].map((columna) => (
          <div key={columna.etiqueta} className="rounded-xl border bg-white/60 px-1.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {columna.etiqueta}
            </div>
            <div className="mt-0.5 text-xs font-semibold tabular-nums">
              {formatearPesos(columna.valor)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PanelResultado({ resultado }: { resultado: ResultadoValuacion }) {
  const { rango } = resultado;

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <FilaCadena
          paso={1}
          titulo="Liquidación por rubros"
          explicacion="Suma de los rubros incluidos."
          valores={resultado.liquidacion}
          testId="cadena-liquidacion"
        />
        <FilaCadena
          paso={2}
          titulo="Intereses"
          explicacion={
            resultado.aniosDeIntereses > 0
              ? `Interés puro por ${resultado.aniosDeIntereses.toFixed(2)} años desde el hecho.`
              : "Sin intereses: falta la fecha del hecho o están desactivados."
          }
          valores={resultado.intereses}
          testId="cadena-intereses"
        />
        <FilaCadena
          paso={3}
          titulo="Reclamo ajustado por responsabilidad"
          explicacion="Capital más intereses, por el porcentaje atribuible a la contraparte."
          valores={resultado.ajustado}
          testId="cadena-ajustado"
        />
        <FilaCadena
          paso={4}
          titulo="Cobrable de la aseguradora"
          explicacion="Topeado por la suma asegurada y descontada la franquicia."
          valores={resultado.cobrableDeAseguradora}
          destacado
          testId="cadena-cobrable"
        />
      </div>

      {resultado.limitadoPorPoliza && (
        <Aviso>
          El reclamo supera la suma asegurada en {formatearPesos(resultado.excedentePoliza.pretendido)}.
          Según la Corte en <em>Flores</em> y <em>Buffoni</em>, el límite de póliza es oponible al
          damnificado: ese excedente sólo se cobra del asegurado, y depende de su solvencia.
        </Aviso>
      )}

      <div className="rounded-2xl border bg-white/80 px-3 py-3" data-testid="panel-rango">
        <div className="text-sm font-semibold">Rango de negociación</div>
        <div className="mt-2 grid gap-2">
          {[
            {
              etiqueta: "Apertura",
              valor: rango.apertura,
              detalle: "El reclamo completo, con todo lo defendible.",
              testId: "rango-apertura",
            },
            {
              etiqueta: "Objetivo",
              valor: rango.objetivo,
              detalle: "Lo razonable, dentro de lo que la póliza puede pagar.",
              testId: "rango-objetivo",
            },
            {
              etiqueta: "Piso",
              valor: rango.piso,
              detalle: "Valor esperado de litigar. Por debajo de esto, conviene el juicio.",
              testId: "rango-piso",
            },
          ].map((fila) => (
            <div
              key={fila.etiqueta}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-xl border bg-white/60 px-3 py-2"
              data-testid={fila.testId}
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {fila.etiqueta}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{fila.detalle}</div>
              </div>
              <div className="text-base font-semibold tabular-nums">{formatearPesos(fila.valor)}</div>
            </div>
          ))}
        </div>
      </div>

      <Aviso>
        Estos números salen de las fórmulas y de los supuestos que cargaste más arriba: son una ayuda
        para decidir, no una tasación. El monto que se reclama y el que se acepta son una decisión
        profesional tuya.
      </Aviso>
    </div>
  );
}
