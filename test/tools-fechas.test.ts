import {
  domingoDePascua, feriadosNacionales, calcularPlazo, calcularRegresivo,
  diferenciaFechas, ampliacionPorDistancia, calcularCaducidad,
  OPCIONES_POR_DEFECTO, formatFecha, esDiaHabil, parseFecha,
} from "../shared/tools/fechas";

let fallos = 0;
function chequear(nombre: string, actual: any, esperado: any) {
  const a = JSON.stringify(actual), e = JSON.stringify(esperado);
  if (a !== e) { console.log(`FALLA  ${nombre}\n   esperado: ${e}\n   obtenido: ${a}`); fallos++; }
  else console.log(`ok     ${nombre} => ${a}`);
}

// Pascua: valores conocidos.
chequear("Pascua 2024", formatFecha(domingoDePascua(2024)), "2024-03-31");
chequear("Pascua 2025", formatFecha(domingoDePascua(2025)), "2025-04-20");
chequear("Pascua 2026", formatFecha(domingoDePascua(2026)), "2026-04-05");
chequear("Pascua 2027", formatFecha(domingoDePascua(2027)), "2027-03-28");

// Viernes Santo 2026 = 3 de abril; Carnaval 2026 = 16 y 17 de febrero.
const f2026 = feriadosNacionales(2026);
const buscar = (m: string) => f2026.filter(f => f.motivo.includes(m)).map(f => f.fecha);
chequear("Viernes Santo 2026", buscar("Viernes Santo"), ["2026-04-03"]);
chequear("Carnaval 2026", buscar("Carnaval"), ["2026-02-16", "2026-02-17"]);
chequear("Año Nuevo 2026", buscar("Año Nuevo"), ["2026-01-01"]);

// 17/08/2026 cae lunes => no se traslada.
chequear("San Martín 2026 (lunes)", buscar("San Martín"), ["2026-08-17"]);
// 12/10/2026 cae lunes => no se traslada.
chequear("Diversidad 2026 (lunes)", buscar("Diversidad"), ["2026-10-12"]);
// 20/11/2026 cae viernes => se traslada al lunes anterior (16/11).
chequear("Soberanía 2026 (viernes -> lunes previo)", buscar("Soberanía"), ["2026-11-16"]);

// Sin feria de enero para aislar el cómputo.
const sinFeria = { feriaEnero: false, inhabilesExtra: [] };

// Notificación jueves 05/03/2026, plazo de 5 días hábiles.
// Cuenta: vie 6, lun 9, mar 10, mie 11, jue 12.
chequear("Plazo 5 días desde jue 05/03/2026",
  calcularPlazo("2026-03-05", 5, sinFeria).vencimiento, "2026-03-12");

// Plazo de 2 días desde viernes 06/03/2026 => lun 9 y mar 10.
chequear("Plazo 2 días desde vie 06/03/2026",
  calcularPlazo("2026-03-06", 2, sinFeria).vencimiento, "2026-03-10");

// Un plazo que cruza Semana Santa 2026 (Viernes Santo 03/04).
// Notif mie 01/04 => jue 2 (feriado Malvinas), vie 3 (Viernes Santo), lun 6, mar 7.
chequear("Plazo 2 días cruzando Semana Santa",
  calcularPlazo("2026-04-01", 2, sinFeria).vencimiento, "2026-04-07");

// Con feria de enero: notif 29/12/2025, 3 días => 30, 31 dic y luego todo enero
// es feria, así que el tercero cae el primer hábil de febrero (lun 02/02/2026).
chequear("Plazo cruzando feria de enero",
  calcularPlazo("2025-12-29", 3, OPCIONES_POR_DEFECTO).vencimiento, "2026-02-02");

// Regresivo: para llegar al jue 12/03/2026 con 5 días hábiles de anticipación.
chequear("Regresivo 5 días hasta jue 12/03/2026",
  calcularRegresivo("2026-03-12", 5, sinFeria).inicio, "2026-03-05");

// Diferencia de fechas / edad exacta.
chequear("Edad 1990-05-20 a 2026-09-12",
  diferenciaFechas("1990-05-20", "2026-09-12"),
  { anios: 36, meses: 3, dias: 23, diasTotales: 13264 });
chequear("Diferencia 2026-01-31 a 2026-03-01",
  diferenciaFechas("2026-01-31", "2026-03-01"),
  { anios: 0, meses: 1, dias: 1, diasTotales: 29 });

// Ampliación por distancia: 1 día cada 200 km.
chequear("Distancia 150 km", ampliacionPorDistancia(150), 0);
chequear("Distancia 200 km", ampliacionPorDistancia(200), 1);
chequear("Distancia 1050 km (Mendoza-CABA)", ampliacionPorDistancia(1050), 5);

// Caducidad: 6 meses desde el 15/03/2026 => 15/09/2026 (martes, hábil).
chequear("Caducidad primera instancia",
  calcularCaducidad("2026-03-15", "primera", sinFeria).vencimiento, "2026-09-15");
// 31/08 + 6 meses => 28/02/2027 (el 31 no existe en febrero).
chequear("Caducidad con día inexistente",
  calcularCaducidad("2026-08-31", "primera", sinFeria).vencimiento, "2027-02-28");
// Vencimiento en plena feria de enero se corre al primer hábil.
chequear("Caducidad venciendo en feria",
  calcularCaducidad("2025-07-10", "primera", OPCIONES_POR_DEFECTO).vencimientoHabil, "2026-02-02");

// Sábados y domingos.
chequear("Sábado es inhábil", esDiaHabil(parseFecha("2026-03-07"), sinFeria), false);
chequear("Domingo es inhábil", esDiaHabil(parseFecha("2026-03-08"), sinFeria), false);

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLA(S)`);
