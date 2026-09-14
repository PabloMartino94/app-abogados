import {
  calcularRubro, calcularValuacion, rubrosDePlantilla, aniosEntre,
  DATOS_INICIALES, PLANTILLAS, type Rubro, type DatosValuacion,
} from "../shared/tools/valuacion";
import { indemnizacionIncapacidad } from "../shared/tools/montos";

let fallos = 0;
function chequear(nombre: string, actual: any, esperado: any) {
  const a = JSON.stringify(actual), e = JSON.stringify(esperado);
  if (a !== e) { console.log(`FALLA  ${nombre}\n   esperado: ${e}\n   obtenido: ${a}`); fallos++; }
  else console.log(`ok     ${nombre} => ${a}`);
}
function cerca(nombre: string, actual: number, esperado: number, tol = 0.5) {
  if (Math.abs(actual - esperado) > tol) { console.log(`FALLA  ${nombre}: esperado ~${esperado}, obtenido ${actual}`); fallos++; }
  else console.log(`ok     ${nombre} => ${actual.toFixed(2)}`);
}

// --- Rubros ---
const manual: Rubro = { id: "a", etiqueta: "Daño moral", modo: "manual", incluido: true, min: 100, pretendido: 200, max: 300 };
chequear("rubro manual", calcularRubro(manual), { min: 100, pretendido: 200, max: 300 });

chequear("rubro excluido no suma",
  calcularRubro({ ...manual, incluido: false }), { min: 0, pretendido: 0, max: 0 });

// Incapacidad: el piso tiene que ser Vuoto y el techo Méndez.
const incap: Rubro = { id: "b", etiqueta: "Incapacidad", modo: "incapacidad", incluido: true, ingresoMensual: 100000, edad: 30, porcentaje: 100 };
const vuoto = indemnizacionIncapacidad(100000, 30, 100, "vuoto").capital;
const mendez = indemnizacionIncapacidad(100000, 30, 100, "mendez").capital;
const rIncap = calcularRubro(incap);
cerca("incapacidad: piso = Vuoto", rIncap.min, vuoto);
cerca("incapacidad: techo = Méndez", rIncap.max, mendez);
cerca("incapacidad: pretendido = techo por defecto", rIncap.pretendido, mendez);
cerca("incapacidad: override manda", calcularRubro({ ...incap, pretendidoOverride: 5000 }).pretendido, 5000);
chequear("incapacidad sin datos da cero",
  calcularRubro({ ...incap, ingresoMensual: 0 }), { min: 0, pretendido: 0, max: 0 });

// --- Años entre fechas ---
cerca("un año exacto", aniosEntre("2025-01-01", "2026-01-01"), 1, 0.01);
chequear("fecha vacía da cero", aniosEntre("", "2026-01-01"), 0);
chequear("fecha invertida da cero", aniosEntre("2026-01-01", "2025-01-01"), 0);

// --- Cadena completa ---
const base: DatosValuacion = {
  ...DATOS_INICIALES,
  rubros: [{ id: "x", etiqueta: "Todo", modo: "manual", incluido: true, min: 1000000, pretendido: 1000000, max: 1000000 }],
  aplicarIntereses: false,
  responsabilidadContraria: 100,
  sumaAsegurada: 0,
  franquicia: 0,
  probabilidadExito: 100,
  aniosHastaCobro: 0,
  tasaDescuentoAnual: 0,
  costosLitigio: 0,
};

const simple = calcularValuacion(base);
cerca("liquidación simple", simple.liquidacion.pretendido, 1000000);
cerca("sin intereses el reclamo no cambia", simple.reclamo.pretendido, 1000000);
cerca("sin póliza, todo es cobrable", simple.cobrableDeAseguradora.pretendido, 1000000);
chequear("sin póliza no hay excedente", simple.excedentePoliza.pretendido, 0);
chequear("sin póliza no está limitado", simple.limitadoPorPoliza, false);

// Responsabilidad concurrente: 70% de la contraparte.
const conCulpa = calcularValuacion({ ...base, responsabilidadContraria: 70 });
cerca("ajuste por responsabilidad 70%", conCulpa.ajustado.pretendido, 700000);

// Intereses: 6% anual puro durante 2 años sobre 1.000.000 => 120.000.
const conIntereses = calcularValuacion({
  ...base, aplicarIntereses: true, tasaPuraAnual: 6,
  fechaHecho: "2024-01-01", fechaCuantificacion: "2026-01-01",
});
cerca("años de intereses", conIntereses.aniosDeIntereses, 2, 0.02);
cerca("intereses puros 6% x 2 años", conIntereses.intereses.pretendido, 120000, 1000);
cerca("reclamo con intereses", conIntereses.reclamo.pretendido, 1120000, 1000);

// Póliza: reclamo 1.000.000 contra póliza de 800.000 con franquicia de 50.000.
const conPoliza = calcularValuacion({ ...base, sumaAsegurada: 800000, franquicia: 50000 });
cerca("cobrable topeado por la póliza", conPoliza.cobrableDeAseguradora.pretendido, 750000);
cerca("excedente sobre la póliza", conPoliza.excedentePoliza.pretendido, 200000);
chequear("marca que la póliza limita", conPoliza.limitadoPorPoliza, true);

// La póliza no puede dar negativo si la franquicia se come todo.
const franquiciaEnorme = calcularValuacion({ ...base, sumaAsegurada: 100000, franquicia: 500000 });
chequear("franquicia mayor que la póliza no da negativo", franquiciaEnorme.cobrableDeAseguradora.pretendido, 0);

// Valor esperado: 50% de probabilidad, 1.000.000 cobrable, sin descuento ni costos.
const ev = calcularValuacion({ ...base, probabilidadExito: 50 });
cerca("valor esperado al 50%", ev.valorEsperadoLitigio, 500000);

// Con descuento temporal: 1.000.000 en 3 años al 6% => 839.619; al 100% de éxito.
const evDescontado = calcularValuacion({ ...base, aniosHastaCobro: 3, tasaDescuentoAnual: 6 });
cerca("valor presente a 3 años al 6%", evDescontado.valorEsperadoLitigio, 1000000 / Math.pow(1.06, 3), 1);

// Los costos se restan.
const evConCostos = calcularValuacion({ ...base, costosLitigio: 200000 });
cerca("costos restados del valor esperado", evConCostos.valorEsperadoLitigio, 800000);

// El valor esperado nunca es negativo.
const evNegativo = calcularValuacion({ ...base, costosLitigio: 5000000 });
chequear("valor esperado no baja de cero", evNegativo.valorEsperadoLitigio, 0);

// El piso nunca supera al objetivo.
const rango = calcularValuacion({ ...base, probabilidadExito: 100, costosLitigio: 0 });
chequear("piso no supera al objetivo", rango.rango.piso <= rango.rango.objetivo, true);

// --- Plantillas ---
chequear("plantillas disponibles", PLANTILLAS.map(p => p.id),
  ["accidente_transito", "despido", "consumo", "generico"]);
const rubrosAT = rubrosDePlantilla("accidente_transito");
chequear("accidente de tránsito trae 10 rubros", rubrosAT.length, 10);
chequear("los rubros arrancan sin incluir", rubrosAT.every(r => !r.incluido), true);
chequear("dos rubros usan fórmula de incapacidad",
  rubrosAT.filter(r => r.modo === "incapacidad").length, 2);
chequear("plantilla desconocida cae en genérico",
  rubrosDePlantilla("no_existe" as any).length, 1);

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLA(S)`);
// Exit code distinto de cero para que `npm test` sirva como señal automática.
process.exitCode = fallos === 0 ? 0 : 1;
