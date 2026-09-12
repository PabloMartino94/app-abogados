import {
  enteroALetras, montoALetras, tasaDeJusticia, honorarios,
  indemnizacionIncapacidad, danosPunitivos,
} from "../shared/tools/montos";

let fallos = 0;
function chequear(nombre: string, actual: any, esperado: any) {
  const a = JSON.stringify(actual), e = JSON.stringify(esperado);
  if (a !== e) { console.log(`FALLA  ${nombre}\n   esperado: ${e}\n   obtenido: ${a}`); fallos++; }
  else console.log(`ok     ${nombre} => ${a}`);
}
function cerca(nombre: string, actual: number, esperado: number, tol = 0.01) {
  if (Math.abs(actual - esperado) > tol) { console.log(`FALLA  ${nombre}: esperado ~${esperado}, obtenido ${actual}`); fallos++; }
  else console.log(`ok     ${nombre} => ${actual.toFixed(2)}`);
}

chequear("0", enteroALetras(0), "cero");
chequear("1", enteroALetras(1), "uno");
chequear("15", enteroALetras(15), "quince");
chequear("16", enteroALetras(16), "dieciséis");
chequear("21", enteroALetras(21), "veintiuno");
chequear("21 apocopado", enteroALetras(21, true), "veintiún");
chequear("30", enteroALetras(30), "treinta");
chequear("31", enteroALetras(31), "treinta y uno");
chequear("100", enteroALetras(100), "cien");
chequear("101", enteroALetras(101), "ciento uno");
chequear("115", enteroALetras(115), "ciento quince");
chequear("200", enteroALetras(200), "doscientos");
chequear("500", enteroALetras(500), "quinientos");
chequear("700", enteroALetras(700), "setecientos");
chequear("900", enteroALetras(900), "novecientos");
chequear("999", enteroALetras(999), "novecientos noventa y nueve");
chequear("1000", enteroALetras(1000), "mil");
chequear("1001", enteroALetras(1001), "mil uno");
chequear("2000", enteroALetras(2000), "dos mil");
chequear("21000", enteroALetras(21000), "veintiún mil");
chequear("100000", enteroALetras(100000), "cien mil");
chequear("123456", enteroALetras(123456), "ciento veintitrés mil cuatrocientos cincuenta y seis");
chequear("1000000", enteroALetras(1000000), "un millón");
chequear("2000000", enteroALetras(2000000), "dos millones");
chequear("21000000", enteroALetras(21000000), "veintiún millones");
chequear("1500000", enteroALetras(1500000), "un millón quinientos mil");
chequear("1234567", enteroALetras(1234567), "un millón doscientos treinta y cuatro mil quinientos sesenta y siete");

// Montos con moneda y centavos.
chequear("1 peso", montoALetras(1).texto, "un peso");
chequear("2 pesos", montoALetras(2).texto, "dos pesos");
chequear("120500.50", montoALetras(120500.5).texto,
  "ciento veinte mil quinientos pesos con cincuenta centavos");
chequear("120500.50 legal", montoALetras(120500.5).formatoLegal,
  "PESOS CIENTO VEINTE MIL QUINIENTOS CON 50/100");
chequear("1 centavo", montoALetras(5.01).texto, "cinco pesos con un centavo");
chequear("redondeo a entero", montoALetras(9.999).texto, "diez pesos");
chequear("dólares", montoALetras(21, "dólares").texto, "veintiún dólares");

// Tasa de justicia.
chequear("tasa 3% sobre 1.000.000", tasaDeJusticia(1000000, "general").tasa, 30000);
chequear("tasa reducida", tasaDeJusticia(1000000, "reducida").tasa, 15000);
chequear("exento", tasaDeJusticia(1000000, "exento").tasa, 0);

// Honorarios: rige el mínimo en UMA cuando la escala queda por debajo.
const h = honorarios(100000, 20, 50000, 10);
cerca("honorarios por escala", h.porEscala, 20000);
cerca("mínimo en pesos", h.minimoEnPesos, 500000);
chequear("rige el mínimo", h.rigeElMinimo, true);
cerca("a regular", h.aRegular, 500000);

// Vuoto: 30 años, 100% incapacidad, $100.000 mensuales.
// a = 100000*13 = 1.300.000 ; n = 35 ; i = 0,06
// C = a * (1 - 1,06^-35)/0,06 = 1.300.000 * 14,4982... = 18.847.7xx
const v = indemnizacionIncapacidad(100000, 30, 100, "vuoto");
chequear("Vuoto años restantes", v.aniosRestantes, 35);
chequear("Vuoto tasa", v.tasa, 0.06);
cerca("Vuoto capital", v.capital, 1300000 * ((1 - Math.pow(1.06, -35)) / 0.06), 1);

// Méndez: mismo caso, tope 75, i 4%, ingreso ajustado por 60/edad.
const m = indemnizacionIncapacidad(100000, 30, 100, "mendez");
chequear("Méndez años restantes", m.aniosRestantes, 45);
chequear("Méndez tasa", m.tasa, 0.04);
cerca("Méndez ingreso computable", m.ingresoAnualComputable, 100000 * (60 / 30) * 13, 1);
chequear("Méndez rinde más que Vuoto", m.capital > v.capital, true);

// Daños punitivos: Pc = 0,25 => D = C * 3.
const d = danosPunitivos(1000000, 0.25);
cerca("multa punitiva", d.multa, 3000000, 1);
cerca("total", d.total, 4000000, 1);
const d2 = danosPunitivos(1000000, 1);
cerca("Pc=1 no hay multa", d2.multa, 0, 0.001);

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLA(S)`);

// Apócope en centavos.
chequear("21 centavos", montoALetras(5.21).texto, "cinco pesos con veintiún centavos");
